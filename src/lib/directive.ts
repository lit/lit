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
 * @module lit-html
 */

import {Part} from './part.js';

const directives = new WeakMap<object, true>();

// tslint:disable-next-line:no-any
type AnyFunc = (...args: any[]) => any;
type DirectiveFn<P extends Part, T> = (part: P, value: T) => void;
type PartialDirective<P extends Part, T> = [DirectiveFn<P, T>, T];

/**
 * Brands a function as a directive factory function so that lit-html will call
 * the function during template rendering, rather than passing as a value.
 *
 * A _directive_ is a function that takes a Part as an argument. It has the
 * signature: `(part: Part) => void`.
 *
 * A directive _factory_ is a function that takes arguments for data and
 * configuration and returns a directive. Users of directive usually refer to
 * the directive factory as the directive. For example, "The repeat directive".
 *
 * Usually a template author will invoke a directive factory in their template
 * with relevant arguments, which will then return a directive function.
 *
 * Here's an example of using the `repeat()` directive factory that takes an
 * array and a function to render an item:
 *
 * ```js
 * html`<ul><${repeat(items, (item) => html`<li>${item}</li>`)}</ul>`
 * ```
 *
 * When `repeat` is invoked, it returns a directive function that closes over
 * `items` and the template function. When the outer template is rendered, the
 * return directive function is called with the Part for the expression.
 * `repeat` then performs it's custom logic to render multiple items.
 *
 * @param f The directive factory function. Must be a function that returns a
 * function of the signature `(part: Part) => void`. The returned function will
 * be called with the part object.
 *
 * @example
 *
 * import {directive, html} from 'lit-html';
 *
 * const immutable = directive((v) => (part) => {
 *   if (part.value !== v) {
 *     part.setValue(v)
 *   }
 * });
 */
export const directive =
    <F extends AnyFunc, P extends Parameters<F>, R extends ReturnType<F>,
                                                           Q extends Part>(
        f: F, inner: DirectiveFn<Q, R>): (...args: P) =>
        PartialDirective<Q, R> => {
          return (...args: P): PartialDirective<Q, R> => {
            const d: PartialDirective<Q, R> = [inner, f(...args)];
            directives.set(d, true);
            return d;
          };
        };

export const isDirective =
    <P extends Part, T>(o: unknown): o is PartialDirective<P, T> => {
      return typeof o === 'object' && directives.has(o as object);
    };
