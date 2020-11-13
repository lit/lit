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

type DisconnectableChild = NodePart | AttributePart | TemplateInstance;

const disconnectableChildrenSets: WeakMap<
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
  removeFromParent?: DisconnectableChild
) => {
  const children = disconnectableChildrenSets.get(child);
  if (children !== undefined) {
    for (const child of children) {
      if (child instanceof NodePart) {
        setNodePartConnected(child, isConnected);
      } else if (child instanceof AttributePart) {
        setAttributePartConnected(child, isConnected);
      } else {
        setConnected(child, isConnected);
      }
    }
    if (removeFromParent !== undefined) {
      disconnectableChildrenSets.get(removeFromParent)?.delete(child);
    }
  }
};

/**
 * Sets the connected state on the part's directive (if present) and,
 * any directives contained within the committed value of this part (i.e.
 * within a TemplateInstance or iterable of NodeParts).
 */
const setNodePartConnected = (part: NodePart, isConnected: boolean) => {
  part._setDirectiveConnected!(part._directive, isConnected);
  part._setValueConnected!(isConnected);
};

/**
 * Sets the connected state on the part's directives.
 */
const setAttributePartConnected = (
  part: AttributePart,
  isConnected: boolean
) => {
  if (part._directives !== undefined) {
    for (const directive of part._directives) {
      part._setDirectiveConnected!(directive, isConnected);
    }
  }
};

/**
 * Sets the connected state on any directives contained within the committed
 * value of this part (i.e. within a TemplateInstance or iterable of NodeParts)
 * and runs their `disconnectedCallback`/`reconnectedCallback`s.
 *
 * Note, this method will be patched onto NodePart instances and called from the
 * core code when parts are cleared or the connection state is changed by the
 * user.
 */
function _setValueConnected(
  this: NodePart,
  isConnected: boolean,
  removeFromParent = false
) {
  if (this._value instanceof TemplateInstance) {
    setConnected(this._value, isConnected, removeFromParent ? this : undefined);
  } else if (Array.isArray(this._value)) {
    const parent = removeFromParent ? this : undefined;
    for (const part of this._value) {
      setConnected(part, isConnected, parent);
    }
  }
  if (removeFromParent) {
    let children = disconnectableChildrenSets.get(this);
    if (children !== undefined && children.size === 0) {
      disconnectableChildrenSets.delete(this);
      for (
        let current = this as DisconnectableChild, parent;
        (parent = current._parent);
        current = parent
      ) {
        (children = disconnectableChildrenSets.get(parent)!).delete(current);
        if (children.size > 0) {
          break;
        }
      }
    }
  }
}

/**
 * Sets the connected state on given directive if disconnectable and runs its
 * `disconnectedCallback`/`reconnectedCallback`s.
 *
 * Note, this method will be patched onto NodePart and AttributePart instances
 * and called from the core code when directives are changed or removed.
 */
function _setDirectiveConnected(
  directive: Directive | undefined,
  isConnected: boolean
) {
  if (directive instanceof DisconnectableDirective) {
    directive._setConnected(isConnected);
  }
}

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
  constructor(partInfo: PartInfo) {
    super();
    if (partInfo instanceof AttributePart) {
      partInfo._setDirectiveConnected = _setDirectiveConnected;
    } else if (partInfo instanceof NodePart) {
      partInfo._setValueConnected = _setValueConnected;
      partInfo._setDirectiveConnected = _setDirectiveConnected;
    }
    for (
      let current = (partInfo as unknown) as DisconnectableChild, parent;
      (parent = current._parent);
      current = parent
    ) {
      let children = disconnectableChildrenSets.get(parent);
      if (children === undefined) {
        disconnectableChildrenSets.set(parent, (children = new Set()));
      } else if (children.has(current)) {
        break;
      }
      if (parent instanceof AttributePart) {
        parent._setDirectiveConnected = _setDirectiveConnected;
      } else if (parent instanceof NodePart) {
        parent._setValueConnected = _setValueConnected;
        parent._setDirectiveConnected = _setDirectiveConnected;
      }
      children.add(current);
    }
  }
  _setConnected(isConnected: boolean) {
    if (isConnected && this.isDisconnected) {
      this.isDisconnected = false;
      this.reconnectedCallback?.();
    } else if (!isConnected && !this.isDisconnected) {
      this.isDisconnected = true;
      this.disconnectedCallback?.();
    }
  }
  _resolve(part: Part, props: Array<unknown>): unknown {
    this._setConnected(true);
    return super._resolve(part, props);
  }
  abstract disconnectedCallback(): void;
  abstract reconnectedCallback(): void;
}
