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

/**
 * A property decorator that converts a class property into a getter that
 * executes a querySelector on the element's renderRoot.
 *
 * @param selector A DOMString containing one or more selectors to match.
 * @param cache An optional boolean which when true performs the DOM query only
 *     once and caches the result.
 *
 * See: https://developer.mozilla.org/en-US/docs/Web/API/Document/querySelector
 *
 * ```ts
 * class MyElement {
 *   @query('#first')
 *   first: HTMLDivElement;
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
export const query =
  (selector: string, cache?: boolean) =>
  <C extends ReactiveElement, V extends Element | null>(
    _target: ClassAccessorDecoratorTarget<C, V>,
    {access: {get, set}}: ClassAccessorDecoratorContext<C, V>
  ): ClassAccessorDecoratorResult<C, V> => {
    return {
      get(this: C): V {
        if (cache) {
          const result = get(this);
          if (result === undefined) {
            const result = this.renderRoot?.querySelector(selector) ?? null;
            // TODO: remove cast
            set(this, result as V);
          }
          return result as V;
        }
        // TODO: if we want to allow users to assert that the query will never
        // return null, we need a new option and to throw here if the result
        // is null.
        return (this.renderRoot?.querySelector(selector) ?? null) as V;
      },
    };
  };
