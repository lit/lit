/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

/*
 * IMPORTANT: For compatibility with tsickle and the Closure JS compiler, all
 * property decorators (but not class decorators) in this file that have
 * an @ExportDecoratedItems annotation must be defined as a regular function,
 * not an arrow function.
 */

import type {ReactiveElement} from '../reactive-element.js';
import type {Interface} from './base.js';

export type EventOptionsDecorator = {
  // legacy
  (
    proto: Interface<ReactiveElement>,
    name: PropertyKey
    // Note TypeScript requires the return type to be `void|any`
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ): void | any;

  // standard
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  <C, V extends (this: C, ...args: any) => any>(
    value: V,
    _context: ClassMethodDecoratorContext<C, V>
  ): void;
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
 * ```ts
 * class MyElement {
 *   clicked = false;
 *
 *   render() {
 *     return html`
 *       <div @click=${this._onClick}>
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
export function eventOptions(
  options: AddEventListenerOptions
): EventOptionsDecorator {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (<C, V extends (this: C, ...args: any) => any>(
    protoOrValue: V,
    nameOrContext: PropertyKey | ClassMethodDecoratorContext<C, V>
  ) => {
    const method =
      typeof protoOrValue === 'function'
        ? protoOrValue
        : protoOrValue[nameOrContext as keyof ReactiveElement];
    Object.assign(method, options);
  }) as EventOptionsDecorator;
}
