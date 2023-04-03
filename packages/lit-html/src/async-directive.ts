/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

/**
 * Overview:
 *
 * This module is designed to add support for an async `setValue` API and
 * `disconnected` callback to directives with the least impact on the core
 * runtime or payload when that feature is not used.
 *
 * The strategy is to introduce a `AsyncDirective` subclass of
 * `Directive` that climbs the "parent" tree in its constructor to note which
 * branches of lit-html's "logical tree" of data structures contain such
 * directives and thus need to be crawled when a subtree is being cleared (or
 * manually disconnected) in order to run the `disconnected` callback.
 *
 * The "nodes" of the logical tree include Parts, TemplateInstances (for when a
 * TemplateResult is committed to a value of a ChildPart), and Directives; these
 * all implement a common interface called `DisconnectableChild`. Each has a
 * `_$parent` reference which is set during construction in the core code, and a
 * `_$disconnectableChildren` field which is initially undefined.
 *
 * The sparse tree created by means of the `AsyncDirective` constructor
 * crawling up the `_$parent` tree and placing a `_$disconnectableChildren` Set
 * on each parent that includes each child that contains a
 * `AsyncDirective` directly or transitively via its children. In order to
 * notify connection state changes and disconnect (or reconnect) a tree, the
 * `_$notifyConnectionChanged` API is patched onto ChildParts as a directive
 * climbs the parent tree, which is called by the core when clearing a part if
 * it exists. When called, that method iterates over the sparse tree of
 * Set<DisconnectableChildren> built up by AsyncDirectives, and calls
 * `_$notifyDirectiveConnectionChanged` on any directives that are encountered
 * in that tree, running the required callbacks.
 *
 * A given "logical tree" of lit-html data-structures might look like this:
 *
 *  ChildPart(N1) _$dC=[D2,T3]
 *   ._directive
 *     AsyncDirective(D2)
 *   ._value // user value was TemplateResult
 *     TemplateInstance(T3) _$dC=[A4,A6,N10,N12]
 *      ._$parts[]
 *        AttributePart(A4) _$dC=[D5]
 *         ._directives[]
 *           AsyncDirective(D5)
 *        AttributePart(A6) _$dC=[D7,D8]
 *         ._directives[]
 *           AsyncDirective(D7)
 *           Directive(D8) _$dC=[D9]
 *            ._directive
 *              AsyncDirective(D9)
 *        ChildPart(N10) _$dC=[D11]
 *         ._directive
 *           AsyncDirective(D11)
 *         ._value
 *           string
 *        ChildPart(N12) _$dC=[D13,N14,N16]
 *         ._directive
 *           AsyncDirective(D13)
 *         ._value // user value was iterable
 *           Array<ChildPart>
 *             ChildPart(N14) _$dC=[D15]
 *              ._value
 *                string
 *             ChildPart(N16) _$dC=[D17,T18]
 *              ._directive
 *                AsyncDirective(D17)
 *              ._value // user value was TemplateResult
 *                TemplateInstance(T18) _$dC=[A19,A21,N25]
 *                 ._$parts[]
 *                   AttributePart(A19) _$dC=[D20]
 *                    ._directives[]
 *                      AsyncDirective(D20)
 *                   AttributePart(A21) _$dC=[22,23]
 *                    ._directives[]
 *                      AsyncDirective(D22)
 *                      Directive(D23) _$dC=[D24]
 *                       ._directive
 *                         AsyncDirective(D24)
 *                   ChildPart(N25) _$dC=[D26]
 *                    ._directive
 *                      AsyncDirective(D26)
 *                    ._value
 *                      string
 *
 * Example 1: The directive in ChildPart(N12) updates and returns `nothing`. The
 * ChildPart will _clear() itself, and so we need to disconnect the "value" of
 * the ChildPart (but not its directive). In this case, when `_clear()` calls
 * `_$notifyConnectionChanged()`, we don't iterate all of the
 * _$disconnectableChildren, rather we do a value-specific disconnection: i.e.
 * since the _value was an Array<ChildPart> (because an iterable had been
 * committed), we iterate the array of ChildParts (N14, N16) and run
 * `setConnected` on them (which does recurse down the full tree of
 * `_$disconnectableChildren` below it, and also removes N14 and N16 from N12's
 * `_$disconnectableChildren`). Once the values have been disconnected, we then
 * check whether the ChildPart(N12)'s list of `_$disconnectableChildren` is empty
 * (and would remove it from its parent TemplateInstance(T3) if so), but since
 * it would still contain its directive D13, it stays in the disconnectable
 * tree.
 *
 * Example 2: In the course of Example 1, `setConnected` will reach
 * ChildPart(N16); in this case the entire part is being disconnected, so we
 * simply iterate all of N16's `_$disconnectableChildren` (D17,T18) and
 * recursively run `setConnected` on them. Note that we only remove children
 * from `_$disconnectableChildren` for the top-level values being disconnected
 * on a clear; doing this bookkeeping lower in the tree is wasteful since it's
 * all being thrown away.
 *
 * Example 3: If the LitElement containing the entire tree above becomes
 * disconnected, it will run `childPart.setConnected()` (which calls
 * `childPart._$notifyConnectionChanged()` if it exists); in this case, we
 * recursively run `setConnected()` over the entire tree, without removing any
 * children from `_$disconnectableChildren`, since this tree is required to
 * re-connect the tree, which does the same operation, simply passing
 * `isConnected: true` down the tree, signaling which callback to run.
 */

import {AttributePart, ChildPart, Disconnectable, Part} from './lit-html.js';
import {isSingleExpression} from './directive-helpers.js';
import {Directive, PartInfo, PartType} from './directive.js';
export * from './directive.js';

const DEV_MODE = true;

/**
 * Recursively walks down the tree of Parts/TemplateInstances/Directives to set
 * the connected state of directives and run `disconnected`/ `reconnected`
 * callbacks.
 *
 * @return True if there were children to disconnect; false otherwise
 */
const notifyChildrenConnectedChanged = (
  parent: Disconnectable,
  isConnected: boolean
): boolean => {
  const children = parent._$disconnectableChildren;
  if (children === undefined) {
    return false;
  }
  for (const obj of children) {
    // The existence of `_$notifyDirectiveConnectionChanged` is used as a "brand" to
    // disambiguate AsyncDirectives from other DisconnectableChildren
    // (as opposed to using an instanceof check to know when to call it); the
    // redundancy of "Directive" in the API name is to avoid conflicting with
    // `_$notifyConnectionChanged`, which exists `ChildParts` which are also in
    // this list
    // Disconnect Directive (and any nested directives contained within)
    // This property needs to remain unminified.
    (obj as AsyncDirective)['_$notifyDirectiveConnectionChanged']?.(
      isConnected,
      false
    );
    // Disconnect Part/TemplateInstance
    notifyChildrenConnectedChanged(obj, isConnected);
  }
  return true;
};

/**
 * Removes the given child from its parent list of disconnectable children, and
 * if the parent list becomes empty as a result, removes the parent from its
 * parent, and so forth up the tree when that causes subsequent parent lists to
 * become empty.
 */
const removeDisconnectableFromParent = (obj: Disconnectable) => {
  let parent, children;
  do {
    if ((parent = obj._$parent) === undefined) {
      break;
    }
    children = parent._$disconnectableChildren!;
    children.delete(obj);
    obj = parent;
  } while (children?.size === 0);
};

const addDisconnectableToParent = (obj: Disconnectable) => {
  // Climb the parent tree, creating a sparse tree of children needing
  // disconnection
  for (let parent; (parent = obj._$parent); obj = parent) {
    let children = parent._$disconnectableChildren;
    if (children === undefined) {
      parent._$disconnectableChildren = children = new Set();
    } else if (children.has(obj)) {
      // Once we've reached a parent that already contains this child, we
      // can short-circuit
      break;
    }
    children.add(obj);
    installDisconnectAPI(parent);
  }
};

/**
 * Changes the parent reference of the ChildPart, and updates the sparse tree of
 * Disconnectable children accordingly.
 *
 * Note, this method will be patched onto ChildPart instances and called from
 * the core code when parts are moved between different parents.
 */
function reparentDisconnectables(this: ChildPart, newParent: Disconnectable) {
  if (this._$disconnectableChildren !== undefined) {
    removeDisconnectableFromParent(this);
    this._$parent = newParent;
    addDisconnectableToParent(this);
  } else {
    this._$parent = newParent;
  }
}

/**
 * Sets the connected state on any directives contained within the committed
 * value of this part (i.e. within a TemplateInstance or iterable of
 * ChildParts) and runs their `disconnected`/`reconnected`s, as well as within
 * any directives stored on the ChildPart (when `valueOnly` is false).
 *
 * `isClearingValue` should be passed as `true` on a top-level part that is
 * clearing itself, and not as a result of recursively disconnecting directives
 * as part of a `clear` operation higher up the tree. This both ensures that any
 * directive on this ChildPart that produced a value that caused the clear
 * operation is not disconnected, and also serves as a performance optimization
 * to avoid needless bookkeeping when a subtree is going away; when clearing a
 * subtree, only the top-most part need to remove itself from the parent.
 *
 * `fromPartIndex` is passed only in the case of a partial `_clear` running as a
 * result of truncating an iterable.
 *
 * Note, this method will be patched onto ChildPart instances and called from the
 * core code when parts are cleared or the connection state is changed by the
 * user.
 */
function notifyChildPartConnectedChanged(
  this: ChildPart,
  isConnected: boolean,
  isClearingValue = false,
  fromPartIndex = 0
) {
  const value = this._$committedValue;
  const children = this._$disconnectableChildren;
  if (children === undefined || children.size === 0) {
    return;
  }
  if (isClearingValue) {
    if (Array.isArray(value)) {
      // Iterable case: Any ChildParts created by the iterable should be
      // disconnected and removed from this ChildPart's disconnectable
      // children (starting at `fromPartIndex` in the case of truncation)
      for (let i = fromPartIndex; i < value.length; i++) {
        notifyChildrenConnectedChanged(value[i], false);
        removeDisconnectableFromParent(value[i]);
      }
    } else if (value != null) {
      // TemplateInstance case: If the value has disconnectable children (will
      // only be in the case that it is a TemplateInstance), we disconnect it
      // and remove it from this ChildPart's disconnectable children
      notifyChildrenConnectedChanged(value as Disconnectable, false);
      removeDisconnectableFromParent(value as Disconnectable);
    }
  } else {
    notifyChildrenConnectedChanged(this, isConnected);
  }
}

/**
 * Patches disconnection API onto ChildParts.
 */
const installDisconnectAPI = (obj: Disconnectable) => {
  if ((obj as ChildPart).type == PartType.CHILD) {
    (obj as ChildPart)._$notifyConnectionChanged ??=
      notifyChildPartConnectedChanged;
    (obj as ChildPart)._$reparentDisconnectables ??= reparentDisconnectables;
  }
};

/**
 * An abstract `Directive` base class whose `disconnected` method will be
 * called when the part containing the directive is cleared as a result of
 * re-rendering, or when the user calls `part.setConnected(false)` on
 * a part that was previously rendered containing the directive (as happens
 * when e.g. a LitElement disconnects from the DOM).
 *
 * If `part.setConnected(true)` is subsequently called on a
 * containing part, the directive's `reconnected` method will be called prior
 * to its next `update`/`render` callbacks. When implementing `disconnected`,
 * `reconnected` should also be implemented to be compatible with reconnection.
 *
 * Note that updates may occur while the directive is disconnected. As such,
 * directives should generally check the `this.isConnected` flag during
 * render/update to determine whether it is safe to subscribe to resources
 * that may prevent garbage collection.
 */
export abstract class AsyncDirective extends Directive {
  // As opposed to other Disconnectables, AsyncDirectives always get notified
  // when the RootPart connection changes, so the public `isConnected`
  // is a locally stored variable initialized via its part's getter and synced
  // via `_$notifyDirectiveConnectionChanged`. This is cheaper than using
  // the _$isConnected getter, which has to look back up the tree each time.
  /**
   * The connection state for this Directive.
   */
  isConnected!: boolean;

  // @internal
  override _$disconnectableChildren?: Set<Disconnectable> = undefined;
  /**
   * Initialize the part with internal fields
   * @param part
   * @param parent
   * @param attributeIndex
   */
  override _$initialize(
    part: Part,
    parent: Disconnectable,
    attributeIndex: number | undefined
  ) {
    super._$initialize(part, parent, attributeIndex);
    addDisconnectableToParent(this);
    this.isConnected = part._$isConnected;
  }
  // This property needs to remain unminified.
  /**
   * Called from the core code when a directive is going away from a part (in
   * which case `shouldRemoveFromParent` should be true), and from the
   * `setChildrenConnected` helper function when recursively changing the
   * connection state of a tree (in which case `shouldRemoveFromParent` should
   * be false).
   *
   * @param isConnected
   * @param isClearingDirective - True when the directive itself is being
   *     removed; false when the tree is being disconnected
   * @internal
   */
  override ['_$notifyDirectiveConnectionChanged'](
    isConnected: boolean,
    isClearingDirective = true
  ) {
    if (isConnected !== this.isConnected) {
      this.isConnected = isConnected;
      if (isConnected) {
        this.reconnected?.();
      } else {
        this.disconnected?.();
      }
    }
    if (isClearingDirective) {
      notifyChildrenConnectedChanged(this, isConnected);
      removeDisconnectableFromParent(this);
    }
  }

  /**
   * Sets the value of the directive's Part outside the normal `update`/`render`
   * lifecycle of a directive.
   *
   * This method should not be called synchronously from a directive's `update`
   * or `render`.
   *
   * @param directive The directive to update
   * @param value The value to set
   */
  setValue(value: unknown) {
    if (isSingleExpression(this.__part as unknown as PartInfo)) {
      this.__part._$setValue(value, this);
    } else {
      // this.__attributeIndex will be defined in this case, but
      // assert it in dev mode
      if (DEV_MODE && this.__attributeIndex === undefined) {
        throw new Error(`Expected this.__attributeIndex to be a number`);
      }
      const newValues = [...(this.__part._$committedValue as Array<unknown>)];
      newValues[this.__attributeIndex!] = value;
      (this.__part as AttributePart)._$setValue(newValues, this, 0);
    }
  }

  /**
   * User callbacks for implementing logic to release any resources/subscriptions
   * that may have been retained by this directive. Since directives may also be
   * re-connected, `reconnected` should also be implemented to restore the
   * working state of the directive prior to the next render.
   */
  protected disconnected() {}
  protected reconnected() {}
}
