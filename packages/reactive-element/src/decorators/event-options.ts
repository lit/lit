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

import {ReactiveElement} from '../reactive-element.js';
import {ClassElement} from './base.js';

const standardEventOptions = (
  options: AddEventListenerOptions,
  element: ClassElement
) => {
  return {
    ...element,
    finisher(clazz: typeof ReactiveElement) {
      Object.assign(
        clazz.prototype[element.key as keyof ReactiveElement],
        options
      );
    },
  };
};

const legacyEventOptions =
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (options: AddEventListenerOptions, proto: any, name: PropertyKey) => {
    Object.assign(proto[name], options);
  };

/**
 * Adds event listener options to a method used as an event listener in a
 * lit-html template.
 *
 * @param options An object that specifies event listener options as accepted by
 * `EventTarget#addEventListener` and `EventTarget#removeEventListener`.
 *
 * Current browsers support the `capture`, `passive`, and `once` options. See:
 * https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener#Parameters
 *
 * @example
 * ```ts
 * class MyElement {
 *   clicked = false;
 *
 *   render() {
 *     return html`
 *       <div @click=${this._onClick}`>
 *         <button></button>
 *       </div>
 *     `;
 *   }
 *
 *   @eventOptions({capture: true})
 *   _onClick(e) {
 *     this.clicked = true;
 *   }
 * }
 * ```
 * @category Decorator
 */
export function eventOptions(options: AddEventListenerOptions) {
  // Return value typed as any to prevent TypeScript from complaining that
  // standard decorator function signature does not match TypeScript decorator
  // signature
  // TODO(kschaaf): unclear why it was only failing on this decorator and not
  // the others
  return ((protoOrDescriptor: Object | ClassElement, name?: string) =>
    name !== undefined
      ? legacyEventOptions(options, protoOrDescriptor as Object, name)
      : standardEventOptions(
          options,
          protoOrDescriptor as ClassElement
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        )) as any;
}
