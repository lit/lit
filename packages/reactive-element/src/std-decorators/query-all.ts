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
 * A property decorator that converts a class property into a getter
 * that executes a querySelectorAll on the element's renderRoot.
 *
 * @param selector A DOMString containing one or more selectors to match.
 *
 * See:
 * https://developer.mozilla.org/en-US/docs/Web/API/Document/querySelectorAll
 *
 * ```ts
 * class MyElement {
 *   @queryAll('div')
 *   divs: NodeListOf<HTMLDivElement>;
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
export const queryAll =
  (selector: string) =>
  <C extends ReactiveElement, V extends NodeList | ReadonlyArray<Element>>(
    _target: ClassAccessorDecoratorTarget<C, V>,
    _context: ClassAccessorDecoratorContext<C, V>
  ): ClassAccessorDecoratorResult<C, V> => {
    return {
      get(this: C): V {
        // TODO: if we want to allow users to assert that the query will never
        // return null, we need a new option and to throw here if the result
        // is null.
        return (this.renderRoot?.querySelectorAll(selector) ??
          []) as unknown as V;
      },
    };
  };
