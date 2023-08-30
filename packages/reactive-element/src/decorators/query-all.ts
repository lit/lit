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
import {defineProperty, type Interface} from './base.js';

export type QueryAllDecorator = {
  // legacy
  (
    proto: Interface<ReactiveElement>,
    name: PropertyKey
    // Note TypeScript requires the return type to be `void|any`
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ): void | any;

  // standard
  <C extends Interface<ReactiveElement>, V extends NodeList>(
    value: ClassAccessorDecoratorTarget<C, V>,
    context: ClassAccessorDecoratorContext<C, V>
  ): void;
};

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
export function queryAll(selector: string): QueryAllDecorator {
  return (<C extends Interface<ReactiveElement>, V extends NodeList>(
    protoOrTarget: ClassAccessorDecoratorTarget<C, V>,
    nameOrContext: PropertyKey | ClassAccessorDecoratorContext<C, V>
  ) => {
    const doQuery = (el: Interface<ReactiveElement>) => {
      const container =
        el.renderRoot ?? (fragment ??= document.createDocumentFragment());
      return container.querySelectorAll(selector);
    };
    if (typeof nameOrContext === 'object') {
      return {
        get(this: C) {
          return doQuery(this);
        },
      };
    } else {
      defineProperty(protoOrTarget, nameOrContext as PropertyKey, {
        get(this: ReactiveElement) {
          return doQuery(this);
        },
      });
      return;
    }
  }) as QueryAllDecorator;
}
