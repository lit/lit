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

import {LitElement} from '../../lit-element.js';
import {
  ClassElement,
  legacyPrototypeMethod,
  standardPrototypeMethod,
} from './base.js';

/**
 * A property decorator that converts a class property into a getter
 * that executes a querySelectorAll on the element's renderRoot.
 *
 * @param selector A DOMString containing one or more selectors to match.
 *
 * See:
 * https://developer.mozilla.org/en-US/docs/Web/API/Document/querySelectorAll
 *
 * @example
 * ```ts
 * class MyElement {
 *   @queryAll('div')
 *   divs;
 *
 *   render() {
 *     return html`
 *       <div id="first"></div>
 *       <div id="second"></div>
 *     `;
 *   }
 * }
 * ```
 * @category Decorator
 */
export function queryAll(selector: string) {
  return (
    protoOrDescriptor: Object | ClassElement,
    // tslint:disable-next-line:no-any decorator
    name?: PropertyKey
  ): any => {
    const descriptor = {
      get(this: LitElement) {
        return this.renderRoot.querySelectorAll(selector);
      },
      enumerable: true,
      configurable: true,
    };
    return name !== undefined
      ? legacyPrototypeMethod(descriptor, protoOrDescriptor as Object, name)
      : standardPrototypeMethod(descriptor, protoOrDescriptor as ClassElement);
  };
}
