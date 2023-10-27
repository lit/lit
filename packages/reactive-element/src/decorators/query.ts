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
  <C extends Interface<ReactiveElement>, V extends Element | null>(
    value: ClassAccessorDecoratorTarget<C, V>,
    context: ClassAccessorDecoratorContext<C, V>
  ): ClassAccessorDecoratorResult<C, V>;
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
  return (<C extends Interface<ReactiveElement>, V extends Element | null>(
    protoOrTarget: ClassAccessorDecoratorTarget<C, V>,
    nameOrContext: PropertyKey | ClassAccessorDecoratorContext<C, V>,
    descriptor?: PropertyDescriptor
  ) => {
    const doQuery = (el: Interface<ReactiveElement>): V => {
      // TODO: if we want to allow users to assert that the query will never
      // return null, we need a new option and to throw here if the result
      // is null.
      return (el.renderRoot?.querySelector(selector) ?? null) as V;
    };
    if (cache) {
      // Accessors to wrap from either:
      //   1. The decorator target, in the case of standard decorators
      //   2. The property descriptor, in the case of experimental decorators
      //      on auto-accessors.
      //   3. Functions that access our own cache-key property on the instance,
      //      in the case of experimental decorators on fields.
      const {get, set} =
        typeof nameOrContext === 'object'
          ? protoOrTarget
          : descriptor ??
            (() => {
              const key = DEV_MODE
                ? Symbol(`${String(nameOrContext)} (@query() cache)`)
                : Symbol();
              type WithCache = ReactiveElement & {
                [key: symbol]: Element | null;
              };
              return {
                get() {
                  return (this as WithCache)[key];
                },
                set(v) {
                  (this as WithCache)[key] = v;
                },
              };
            })();
      return desc(protoOrTarget, nameOrContext, {
        get(this: ReactiveElement): V {
          if (cache) {
            let result: V = get!.call(this);
            if (result === undefined) {
              result = doQuery(this);
              set!.call(this, result);
            }
            return result;
          }
          return doQuery(this);
        },
      });
    } else {
      // This object works as the return type for both standard and
      // experimental decorators.
      return desc(protoOrTarget, nameOrContext, {
        get(this: ReactiveElement) {
          return doQuery(this);
        },
      });
    }
  }) as QueryDecorator;
}
