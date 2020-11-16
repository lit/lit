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
  $private,
  NodePart,
  AttributePart,
  Part,
} from './lit-html.js';
export {directive} from './lit-html.js';

const {_TemplateInstance: TemplateInstance} = $private;
type TemplateInstance = InstanceType<typeof TemplateInstance>;

type DisconnectableChild =
  | NodePart
  | AttributePart
  | TemplateInstance
  | DisconnectableDirective;

// Contains the sparse tree of Parts/TemplateInstances needing disconnect
const disconnectableChildrenForParent: WeakMap<
  DisconnectableChild,
  Set<DisconnectableChild>
> = new WeakMap();

/**
 * Recursively walks down the tree of Parts/TemplateInstances to set the
 * connected state of directives and run `disconnectedCallback`/
 * `reconnectedCallback`s.
 */
const setConnected = (
  child: DisconnectableChild,
  isConnected: boolean,
  shouldRemoveFromParent = false
) => {
  const children = disconnectableChildrenForParent.get(child);
  if (children !== undefined) {
    for (const child of children) {
      if (child instanceof DisconnectableDirective) {
        child._setConnected(isConnected);
      } else {
        setConnected(child, isConnected);
      }
    }
    if (shouldRemoveFromParent) {
      disconnectableChildrenForParent.get(child._parent!)?.delete(child);
    }
  }
};

/**
 * Removes the given child from its parent list of disconnectable children if
 * its own list is empty, and so forth up the tree when that causes subsequent
 * parent lists to become empty.
 */
const removeFromParentIfEmpty = (child: DisconnectableChild) => {
  for (
    let parent = child._parent,
      children = disconnectableChildrenForParent.get(child);
    children !== undefined && children.size === 0;
    child = parent, parent = child._parent
  ) {
    disconnectableChildrenForParent.delete(child);
    if (parent !== undefined) {
      children = disconnectableChildrenForParent.get(parent)!;
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
  if (value instanceof TemplateInstance) {
    setConnected(value, isConnected, shouldRemoveFromParent);
  } else if (Array.isArray(value)) {
    for (let i = from; i < value.length; i++) {
      setConnected(value[i], isConnected, shouldRemoveFromParent);
    }
  }
  if (shouldRemoveFromParent) {
    removeFromParentIfEmpty(this);
  }
}

/**
 * Sets the connected state on given directive if disconnectable and runs its
 * `disconnectedCallback`/`reconnectedCallback`s.
 *
 * `shouldRemoveFromParent` should be passed as `true` only when a directive
 * itself is disconnecting as a result of the part value changing, and not as a
 * result of recursively disconnecting directives as part of a `clear`
 * operation, as a performance optimization to avoid needless bookkeeping when a
 * subtree is going away.
 *
 * Note, this method will be patched onto NodePart and AttributePart instances
 * and called from the core code when directives are changed or removed.
 */
function _setDirectiveConnected(
  this: Part,
  directive: Directive | undefined,
  isConnected: boolean,
  shouldRemoveFromParent = false
) {
  if (directive instanceof DisconnectableDirective) {
    directive._setConnected(isConnected);
    if (shouldRemoveFromParent) {
      disconnectableChildrenForParent.get(this)!.delete(directive);
      removeFromParentIfEmpty(this);
    }
  }
}

/**
 * TODO(kschaaf): Patches disconnection API onto the parent; we could also just
 * install this on the prototype once, or bite the bullet and put it in core;
 * the former would add a small runtime tax, and the latter would add a large
 * code size tax.
 */
const installDisconnectAPI = (child: DisconnectableChild) => {
  if (child instanceof AttributePart) {
    child._setDirectiveConnected = _setDirectiveConnected;
  } else if (child instanceof NodePart) {
    child._setValueConnected = _setValueConnected;
    child._setDirectiveConnected = _setDirectiveConnected;
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
  isDisconnected = false;
  _parent: Part;
  constructor(partInfo: PartInfo) {
    super();
    this._parent = partInfo as Part;
    // Climb the parent tree, creating a sparse tree of children needing
    // disconnection
    for (
      let current = this as DisconnectableChild, parent;
      (parent = current._parent);
      current = parent
    ) {
      let children = disconnectableChildrenForParent.get(parent);
      if (children === undefined) {
        disconnectableChildrenForParent.set(parent, (children = new Set()));
      } else if (children.has(current)) {
        // Once we've reached a parent that already contains this child, we
        // can short-circuit
        break;
      }
      children.add(current);
      installDisconnectAPI(parent);
    }
  }
  /** @internal */
  _setConnected(isConnected: boolean) {
    if (isConnected && this.isDisconnected) {
      this.isDisconnected = false;
      this.reconnectedCallback?.();
    } else if (!isConnected && !this.isDisconnected) {
      this.isDisconnected = true;
      this.disconnectedCallback?.();
    }
  }
  /** @internal */
  _resolve(part: Part, props: Array<unknown>): unknown {
    this._setConnected(true);
    return super._resolve(part, props);
  }
  abstract disconnectedCallback(): void;
  abstract reconnectedCallback(): void;
}
