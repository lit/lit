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

const DEV_MODE = true;

export type QueryDecorator = {
  // legacy
  (
    proto: Interface<ReactiveElement>,
    name: PropertyKey,
    descriptor?: PropertyDescriptor
    // Note TypeScript requires the return type to be `void|any`
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ): void | any;

  // standard
  <C extends Interface<ReactiveElement>, V extends Element>(
    value: ClassAccessorDecoratorTarget<C, V>,
    context: ClassAccessorDecoratorContext<C, V>
  ): void;
};

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
export function query(selector: string, cache?: boolean): QueryDecorator {
  return (<C extends Interface<ReactiveElement>, V extends Element>(
    protoOrTarget: ClassAccessorDecoratorTarget<C, V>,
    nameOrContext: PropertyKey | ClassAccessorDecoratorContext<C, V>
  ) => {
    const doQuery = (el: Interface<ReactiveElement>): V => {
      return (el.renderRoot?.querySelector(selector) ?? null) as V;
    };
    if (typeof nameOrContext === 'object') {
      return {
        get(this: C): V {
          if (cache) {
            let result: V | null = protoOrTarget.get.call(this);
            if (result === undefined) {
              result = doQuery(this);
              protoOrTarget.set.call(this, result);
            }
            return result;
          }
          // TODO: if we want to allow users to assert that the query will never
          // return null, we need a new option and to throw here if the result
          // is null.
          return doQuery(this);
        },
      };
    } else {
      if (cache) {
        const key = DEV_MODE
          ? Symbol(`${String(nameOrContext)} (@query() cache)`)
          : Symbol();
        type WithCache = ReactiveElement & {[key: symbol]: Element | null};
        defineProperty(protoOrTarget, nameOrContext as PropertyKey, {
          get(this: WithCache) {
            if (this[key] === undefined) {
              this[key] = doQuery(this);
            }
            return this[key];
          },
        });
      } else {
        defineProperty(protoOrTarget, nameOrContext as PropertyKey, {
          get(this: ReactiveElement) {
            return doQuery(this);
          },
        });
      }
      return;
    }
  }) as QueryDecorator;
}
