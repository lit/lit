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
import {desc, type Interface} from './base.js';

export type QueryAsyncAllDecorator = {
  // legacy
  (
    proto: Interface<ReactiveElement>,
    name: PropertyKey,
    descriptor?: PropertyDescriptor
    // Note TypeScript requires the return type to be `void|any`
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ): void | any;

  // standard
  <
    C extends Interface<ReactiveElement>,
    V extends Promise<NodeListOf<Element>>,
  >(
    value: ClassAccessorDecoratorTarget<C, V>,
    context: ClassAccessorDecoratorContext<C, V>
  ): ClassAccessorDecoratorResult<C, V>;
};

// Shared fragment used to generate empty NodeLists when a render root is
// undefined
let fragment: DocumentFragment;

/**
 * A property decorator that converts a class property into a getter that
 * returns a promise that resolves to the result of a querySelectorAll on the
 * element's renderRoot done after the element's `updateComplete` promise
 * resolves.
 *
 * @param selector A DOMString containing one or more selectors to match.
 *
 * See: https://developer.mozilla.org/en-US/docs/Web/API/Document/querySelectorAll
 *
 * ```ts
 * class MyElement {
 *   @queryAsyncAll('div')
 *   divs: Promise<NodeListOf<HTMLDivElement>>;
 *
 *   render() {
 *     return html`
 *       <div></div>
 *       <div></div>
 *     `;
 *   }
 * }
 * ```
 * @category Decorator
 */
export function queryAsyncAll(selector: string) {
  return ((
    obj: object,
    name: PropertyKey | ClassAccessorDecoratorContext<unknown, unknown>
  ) => {
    return desc(obj, name, {
      async get(this: ReactiveElement) {
        await this.updateComplete;
        const container =
          this.renderRoot ?? (fragment ??= document.createDocumentFragment());
        return container.querySelectorAll(selector);
      },
    });
  }) as QueryAsyncAllDecorator;
}
