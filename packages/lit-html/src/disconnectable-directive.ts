/**
 * @license
 * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at
 * http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at
 * http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */

import {
  Directive,
  PartInfo,
  NodePart,
  NODE_PART,
  DisconnectableParent,
  Part,
} from './lit-html.js';
export {directive} from './lit-html.js';

/**
 * Recursively walks down the tree of Parts/TemplateInstances/Directives to set
 * the connected state of directives and run `disconnectedCallback`/
 * `reconnectedCallback`s.
 */
const setConnected = (
  parent: DisconnectableParent,
  isConnected: boolean,
  shouldRemoveFromParent = false
) => {
  const children = parent._$disconnetableChildren;
  if (children !== undefined) {
    for (const child of children) {
      if ((child as Directive)._$setConnected) {
        (child as DisconnectableDirective)._$setConnected(isConnected, false);
      }
      setConnected(child, isConnected);
    }
    if (shouldRemoveFromParent) {
      parent._$parent?._$disconnetableChildren!.delete(parent);
    }
  }
};

/**
 * Removes the given child from its parent list of disconnectable children if
 * its own list is empty, and so forth up the tree when that causes subsequent
 * parent lists to become empty.
 */
const removeFromParentIfEmpty = (child: DisconnectableParent) => {
  for (
    let parent = child._$parent, children = child._$disconnetableChildren;
    children !== undefined && children.size === 0;
    child = parent, parent = child._$parent
  ) {
    child._$disconnetableChildren = undefined;
    if (parent !== undefined) {
      children = parent._$disconnetableChildren!;
      children.delete(child);
    } else {
      break;
    }
  }
};

/**
 * Sets the connected state on any directives contained within the committed
 * value of this part (i.e. within a TemplateInstance or iterable of NodeParts)
 * and runs their `disconnectedCallback`/`reconnectedCallback`s.
 *
 * `shouldRemoveFromParent` should be passed as `true` on a top-level part that
 * is clearing itself, and not as a result of recursively disconnecting
 * directives as part of a `clear` operation, as a performance optimization to
 * avoid needless bookkeeping when a subtree is going away; when clearing a
 * subtree, only the top-most part need to remove itself from the parent.
 *
 * Note, this method will be patched onto NodePart instances and called from the
 * core code when parts are cleared or the connection state is changed by the
 * user.
 */
function _setValueConnected(
  this: NodePart,
  isConnected: boolean,
  shouldRemoveFromParent = false,
  from = 0
) {
  const value = this._value;
  if (Array.isArray(value)) {
    // Iterable case
    for (let i = from; i < value.length; i++) {
      setConnected(value[i], isConnected, shouldRemoveFromParent);
    }
  } else if (value != null) {
    // Part or Directive case
    setConnected(
      value as DisconnectableParent,
      isConnected,
      shouldRemoveFromParent
    );
  }
  if (shouldRemoveFromParent) {
    removeFromParentIfEmpty(this);
  }
}

/**
 * Patches disconnection API onto NodeParts.
 */
const installDisconnectAPI = (child: DisconnectableParent) => {
  if ((child as NodePart).type == NODE_PART) {
    (child as NodePart)._$setValueConnected ??= _setValueConnected;
  }
};

/**
 * An abstract `Directive` base class whose `disconnectedCallback` will be
 * called when the part containing the directive is cleared as a result of
 * re-rendering, or when the user calls `part.setDirectiveConnection(false)` on
 * a part that was previously rendered containing the directive.
 *
 * If `part.setDirectiveConnection(true)` is subsequently called on a containing
 * part, the directive's `reconnectedCallback` will be called prior to its next
 * `update`/`render` callbacks. When implementing `disconnectedCallback`,
 * `reconnectedCallback` should also be implemented to be compatible with
 * reconnection.
 */
export abstract class DisconnectableDirective extends Directive {
  isConnected = true;
  _$parent: Part;
  _$disconnetableChildren?: Set<DisconnectableParent> = undefined;
  constructor(partInfo: PartInfo, attributeIndex?: number) {
    super(partInfo, attributeIndex);
    this._$parent = partInfo as Part;
    // Climb the parent tree, creating a sparse tree of children needing
    // disconnection
    for (
      let current = this as DisconnectableParent, parent;
      (parent = current._$parent);
      current = parent
    ) {
      let children = parent._$disconnetableChildren;
      if (children === undefined) {
        parent._$disconnetableChildren = children = new Set();
      } else if (children.has(current)) {
        // Once we've reached a parent that already contains this child, we
        // can short-circuit
        break;
      }
      children.add(current);
      installDisconnectAPI(parent);
    }
  }
  /**
   * Called from the core code when a directive is going away from a part (in
   * which case `shouldRemoveFromParent` should be true), and
   * from the `setConnected` helper function when recursively changing the
   * connection state of a tree (in which case `shouldRemoveFromParent` should
   * be false).
   *
   * @param isConnected
   * @param shouldRemoveFromParent
   * @internal
   */
  _$setConnected(isConnected: boolean, shouldRemoveFromParent = true) {
    this._setConnected(isConnected);
    if (shouldRemoveFromParent) {
      this._$parent._$disconnetableChildren!.delete(this);
      removeFromParentIfEmpty(this._$parent);
    }
  }
  /**
   * Private method used to set the connection state of the directive and
   * call the respective `disconnectedCallback` or `reconnectedCallback`
   * callback. Note that since `isConnected` defaults to true, we do not run
   * `reconnectedCallback` on first render.
   * @param isConnected
   * @internal
   */
  private _setConnected(isConnected: boolean) {
    if (isConnected && !this.isConnected) {
      this.isConnected = true;
      this.reconnectedCallback?.();
    } else if (!isConnected && this.isConnected) {
      this.isConnected = false;
      this.disconnectedCallback?.();
    }
  }
  /**
   * Override of the base `_resolve` method to ensure `reconnectedCallback` is
   * run prior to the next render.
   *
   * TODO(kschaaf): Note that rather than automatically re-connecting directives
   * upon re-render, we could also treat this like an error and throw if the
   * user has not called `part.setDirectiveConnection(true)` before rendering
   * again.
   *
   * @override
   * @internal
   */
  _resolve(props: Array<unknown>): unknown {
    this._setConnected(true);
    return super._resolve(props);
  }
  /**
   * User callback for implementing logic to release any resources/subscriptions
   * that may have been retained by this directive. Since directives may also be
   * re-connected, `reconnectedCallback` should also be implemented to restore
   * working state of the directive prior to the next render.
   */
  abstract disconnectedCallback(): void;
  abstract reconnectedCallback(): void;
}
