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
import type {Interface} from '../legacy-decorators/base.js';

// Shared fragment used to generate empty NodeLists when a render root is
// undefined
let fragment: DocumentFragment;

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
// TODO(justinfagnani): infer a more precise return type when the query is
// a tagname.
export const queryAll =
  <S extends string>(selector: S) =>
  <C extends Interface<ReactiveElement>, V extends NodeList>(
    _target: ClassAccessorDecoratorTarget<C, V>,
    _context: ClassAccessorDecoratorContext<C, V>
  ): ClassAccessorDecoratorResult<C, V> => {
    return {
      get(this: C) {
        return (
          this.renderRoot ?? (fragment ??= document.createDocumentFragment())
        ).querySelectorAll(selector) as unknown as V;
      },
    };
  };
