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
import type {Interface} from '../decorators/base.js';
import {queryAll as standardQueryAll} from '../std-decorators/query-all.js';

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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (<C extends Interface<ReactiveElement>, V extends NodeList>(
    protoOrTarget: ClassAccessorDecoratorTarget<C, V>,
    nameOrContext: PropertyKey | ClassAccessorDecoratorContext<C, V>
  ) => {
    if (typeof nameOrContext === 'object') {
      return standardQueryAll(selector)(
        protoOrTarget,
        nameOrContext as ClassAccessorDecoratorContext<C, V>
      );
    } else {
      Object.defineProperty(protoOrTarget, nameOrContext as PropertyKey, {
        get(this: ReactiveElement) {
          return this.renderRoot?.querySelectorAll(selector) ?? [];
        },
        enumerable: true,
        configurable: true,
      });
      return;
    }
  }) as QueryAllDecorator;
}
