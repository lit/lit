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

/*
 * IMPORTANT: For compatibility with tsickle and the Closure JS compiler, all
 * property decorators (but not class decorators) in this file that have
 * an @ExportDecoratedItems annotation must be defined as a regular function,
 * not an arrow function.
 */

import {UpdatingElement} from '../updating-element.js';
import {
  ClassElement,
  legacyPrototypeMethod,
  standardPrototypeMethod,
} from './base.js';

// TODO(sorvell): Remove when https://github.com/webcomponents/polyfills/issues/397 is addressed.
// x-browser support for matches
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ElementProto = Element.prototype as any;
const legacyMatches =
  ElementProto.msMatchesSelector || ElementProto.webkitMatchesSelector;

/**
 * A property decorator that converts a class property into a getter that
 * returns the `assignedNodes` of the given named `slot`. Note, the type of
 * this property should be annotated as `NodeListOf<HTMLElement>`.
 *
 * @param slotName A string name of the slot.
 * @param flatten A boolean which when true flattens the assigned nodes,
 *     meaning any assigned nodes that are slot elements are replaced with their
 *     assigned nodes.
 * @param selector A string which filters the results to elements that match
 *     the given css selector.
 *
 * * @example
 * ```ts
 * class MyElement {
 *   @queryAssignedNodes('list', true, '.item')
 *   listItems;
 *
 *   render() {
 *     return html`
 *       <slot name="list"></slot>
 *     `;
 *   }
 * }
 * ```
 * @category Decorator
 */
export function queryAssignedNodes(
  slotName = '',
  flatten = false,
  selector = ''
) {
  return (
    protoOrDescriptor: Object | ClassElement,
    name?: PropertyKey
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ): any => {
    const descriptor = {
      get(this: UpdatingElement) {
        const slotSelector = `slot${
          slotName ? `[name=${slotName}]` : ':not([name])'
        }`;
        const slot = this.renderRoot?.querySelector(slotSelector);
        let nodes = (slot as HTMLSlotElement)?.assignedNodes({flatten});
        if (nodes && selector) {
          nodes = nodes.filter(
            (node) =>
              node.nodeType === Node.ELEMENT_NODE &&
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              ((node as any).matches
                ? (node as Element).matches(selector)
                : legacyMatches.call(node as Element, selector))
          );
        }
        return nodes;
      },
      enumerable: true,
      configurable: true,
    };
    return name !== undefined
      ? legacyPrototypeMethod(descriptor, protoOrDescriptor as Object, name)
      : standardPrototypeMethod(descriptor, protoOrDescriptor as ClassElement);
  };
}
