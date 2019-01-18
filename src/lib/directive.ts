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
export type DirectiveFactory = (...args: any[]) => object;

export type DirectiveFn = (part: Part) => void;

/**
 * Brands a function as a directive so that lit-html will call the function
 * during template rendering, rather than passing as a value.
 *
 * @param f The directive factory function. Must be a function that returns a
 * function of the signature `(part: Part) => void`. The returned function will
 * be called with the part object
 *
 * @example
 *
 * ```
 * import {directive, html} from 'lit-html';
 *
 * const immutable = directive((v) => (part) => {
 *   if (part.value !== v) {
 *     part.setValue(v)
 *   }
 * });
 * ```
 */
// tslint:disable-next-line:no-any
export const directive = <F extends DirectiveFactory>(f: F): F =>
    ((...args: unknown[]) => {
      const d = f(...args);
      directives.set(d, true);
      return d;
    }) as F;

export const isDirective = (o: unknown): o is DirectiveFn => {
  return typeof o === 'function' && directives.has(o);
};
