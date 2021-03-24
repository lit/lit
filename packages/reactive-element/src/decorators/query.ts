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

import {ReactiveElement} from '../reactive-element.js';
import {decorateProperty} from './base.js';

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
 * @example
 *
 * ```ts
 * class MyElement {
 *   @query('#first')
 *   first;
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
export function query(selector: string, cache?: boolean) {
  return decorateProperty({
    descriptor: (name: PropertyKey) => {
      const descriptor = {
        get(this: ReactiveElement) {
          return this.renderRoot?.querySelector(selector);
        },
        enumerable: true,
        configurable: true,
      };
      if (cache) {
        const key = typeof name === 'symbol' ? Symbol() : `__${name}`;
        descriptor.get = function (this: ReactiveElement) {
          if (
            ((this as unknown) as {[key: string]: Element | null})[
              key as string
            ] === undefined
          ) {
            ((this as unknown) as {[key: string]: Element | null})[
              key as string
            ] = this.renderRoot?.querySelector(selector);
          }
          return ((this as unknown) as {[key: string]: Element | null})[
            key as string
          ];
        };
      }
      return descriptor;
    },
  });
}
