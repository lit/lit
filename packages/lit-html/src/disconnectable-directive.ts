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

/**
 * Overview:
 *
 * This module is designed to add `disconnectedCallback` support to directives
 * with the least impact on the core runtime or payload when that feature is not
 * used.
 *
 * The strategy is to introduce a `DisconnectableDirective` subclass of
 * `Directive` that climbs the "parent" tree in its constructor to note which
 * branches of lit-html's "logical tree" of data structures contain such
 * directives and thus need to be crawled when a subtree is being cleared
 * (or manually disconnected) in order to run the `disconnectedCallback`.
 *
 * The "nodes" of the logical tree include Parts, TemplateInstances (for when a
 * TemplateResult is committed to a value of a NodePart), and Directives; these
 * all implement a common interface called `DisconnectableChild`. Each
 * has a `_$parent` reference which is set during construction in the core code.
 *
 * The sparse tree is maintained by placing a `_$disconnectableChildren` Set on
 * each parent, referencing each child that contains a `DisconnectableDirective`
 * directly or transitively via its children. To disconnect (or reconnect) a
 * tree, the `_$setNodePartConnected` API is patched onto NodeParts as a
 * directive climbs the parent tree, which is called by the core when clearing a
 * part if it exists. When called, that method iterates over the sparse tree of
 * Set<DisconnectableChildren> built up by DisconnectableDirectives, and calls
 * `_$setDirectiveConnected` on any directives that are encountered in that
 * tree.
 *
 * A given "logical tree" of lit-html data-structures might look like this:
 *
 *  NodePart(N1) _$dC=[D2,T3]
 *   ._directive
 *     DisconnectableDirective(D2)
 *   ._value // user value was TemplateResult
 *     TemplateInstance(T3) _$dC=[A4,A6,N10,N12]
 *      ._parts[]
 *        AttributePart(A4) _$dC=[D5]
 *         ._directives[]
 *           DisconnectableDirective(D5)
 *        AttributePart(A6) _$dC=[D7,D8]
 *         ._directives[]
 *           DisconnectableDirective(D7)
 *           Directive(D8) _$dC=[D9]
 *            ._directive
 *              DisconnectableDirective(D9)
 *        NodePart(N10) _$dC=[D11]
 *         ._directive
 *           DisconnectableDirective(D11)
 *         ._value
 *           string
 *        NodePart(N12) _$dC=[D13,N14,N16]
 *         ._directive
 *           DisconnectableDirective(D13)
 *         ._value // user value was iterable
 *           Array<NodePart>
 *             NodePart(N14) _$dC=[D15]
 *              ._value
 *                string
 *             NodePart(N16) _$dC=[D17,T18]
 *              ._directive
 *                DisconnectableDirective(D17)
 *              ._value // user value was TemplateResult
 *                TemplateInstance(T18) _$dC=[A19,A21,N25]
 *                 ._parts[]
 *                   AttributePart(A19) _$dC=[D20]
 *                    ._directives[]
 *                      DisconnectableDirective(D20)
 *                   AttributePart(A21) _$dC=[22,23]
 *                    ._directives[]
 *                      DisconnectableDirective(D22)
 *                      Directive(D23) _$dC=[D24]
 *                       ._directive
 *                         DisconnectableDirective(D24)
 *                   NodePart(N25) _$dC=[D26]
 *                    ._directive
 *                      DisconnectableDirective(D26)
 *                    ._value
 *                      string
 *
 * Example 1: The directive in NodePart(N12) updates and returns `nothing`. The
 * NodePart will _clear() itself, and so we need to disconnect the "value" of
 * the NodePart (but not its directive). In this case, when `_clear()` calls
 * `_$setNodePartConnected()`, we don't iterate all of the
 * _$disconnectableChildren, rather we do a value-specific disconnection: i.e.
 * since the _value was an Array<NodePart> (because an iterable had been
 * committed), we iterate the array of NodeParts (N14, N16) and run
 * `setConnected` on them (which does recurse down the full tree of
 * `_$disconnectableChildren` below it, and also removes N14 and N16 from N12's
 * `_$disconnectableChildren`). Once the values have been disconnected, we then
 * check whether the NodePart(N12)'s list of `_$disconnectableChildren` is empty
 * (and would remove it from its parent TemplateInstance(T3) if so), but since
 * it would still contain its directive D13, it stays in the disconnectable
 * tree.
 *
 * Example 2: In the course of Example 1, `setConnected` will reach
 * NodePart(N16); in this case the entire part is being disconnected, so we
 * simply iterate all of N16's `_$disconnectableChildren` (D17,T18) and
 * recursively run `setConnected` on them. Note that we only remove children
 * from `_$disconnectableChildren` for the top-level values being disconnected
 * on a clear; doing this bookkeeping lower in the tree is wasteful since it's
 * all being thrown away.
 *
 * Example 3: If the LitElement containing the entire tree above becomes
 * disconnected, it will run `setDirectiveConnection()` (which calls
 * `part._$setNodePartConnected()` if it exists); in this case, we recursively
 * run `setConnected()` over the entire tree, without removing any children from
 * `_$disconnectableChildren`, since this tree is required to re-connect the
 * tree, which does the same operation, simply passing `isConnectd: true` down
 * the tree, signaling which callback to run.
 */

import {
  Directive,
  PartInfo,
  NodePart,
  NODE_PART,
  DisconnectableParent,
} from './lit-html.js';
export {directive} from './lit-html.js';

/**
 * Recursively walks down the tree of Parts/TemplateInstances/Directives to set
 * the connected state of directives and run `disconnectedCallback`/
 * `reconnectedCallback`s.
 */
const setChildrenConnected = (
  parent: DisconnectableParent,
  isConnected: boolean,
  shouldRemoveFromParent = false
) => {
  const children = parent._$disconnetableChildren;
  if (children !== undefined) {
    for (const child of children) {
      if ((child as Directive)._$setDirectiveConnected) {
        // Disconnect Directive (and any directive children)
        (child as DisconnectableDirective)._$setDirectiveConnected(
          isConnected,
          false
        );
      } else {
        // Disconnect Part/TemplateInstance
        setChildrenConnected(child, isConnected);
      }
    }
    if (shouldRemoveFromParent) {
      // When a NodePart is being cleared, this method will be called with its
      // value (a TemplateInstance or iterable of NodeParts) and
      // shouldRemoveFromParent==true. In that case, we will delete the value
      // (`parent` in this function) from the NodePart, and then the NodePart
      // will call `removeFromParentIfEmpty` to determine whether to remove the
      // NodePart from _its_ parent.
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
 * and runs their `disconnectedCallback`/`reconnectedCallback`s, as well as
 * within any directives stored on the NodePart (when `valueOnly` is false).
 *
 * `valueOnly` should be passed as `true` on a top-level part that is clearing
 * itself, and not as a result of recursively disconnecting directives as part
 * of a `clear` operation higher up the tree. This both ensures that any
 * directive on this NodePart that produced a value that caused the clear
 * operation is not disconnected, and also serves as a performance optimization
 * to avoid needless bookkeeping when a subtree is going away; when clearing a
 * subtree, only the top-most part need to remove itself from the parent.
 *
 * Note, this method will be patched onto NodePart instances and called from the
 * core code when parts are cleared or the connection state is changed by the
 * user.
 */
function setNodePartConnected(
  this: NodePart,
  isConnected: boolean,
  valueOnly = false,
  from = 0
) {
  const value = this._value;
  if (this._$disconnetableChildren !== undefined) {
    if (valueOnly) {
      if (Array.isArray(value)) {
        // Iterable case: Any NodeParts created by the iterable should be
        // disconnected and removed from this NodePart's disconnectable
        // children, and we will remove this NodePart from its parent in the
        // call to `removeFromParentIfEmpty` below if that causes this NodePart
        // to become empty
        for (let i = from; i < value.length; i++) {
          setChildrenConnected(value[i], isConnected, true);
        }
      } else if (value != null) {
        // TemplateInstance case: If the value has disconnectable children (will
        // only be in the case that it is a TemplateInstance), we disconnect it
        // and remove it from this NodePart's disconnectable children, and we
        // will remove this NodePart from its parent in the call to
        // `removeFromParentIfEmpty` below if that causes this NodePart to
        // become empty
        setChildrenConnected(value as DisconnectableParent, isConnected, true);
      }
      removeFromParentIfEmpty(this);
    } else {
      setChildrenConnected(this, isConnected);
    }
  }
}

/**
 * Patches disconnection API onto NodeParts.
 */
const installDisconnectAPI = (child: DisconnectableParent) => {
  if ((child as NodePart).type == NODE_PART) {
    (child as NodePart)._$setNodePartConnected ??= setNodePartConnected;
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
  _$disconnetableChildren?: Set<DisconnectableParent> = undefined;
  constructor(partInfo: PartInfo) {
    super(partInfo);
    this._$parent = partInfo._$parent;
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
  _$setDirectiveConnected(isConnected: boolean, shouldRemoveFromParent = true) {
    this._setConnected(isConnected);
    setChildrenConnected(this, isConnected);
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
