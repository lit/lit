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
import {query as standardQuery} from '../std-decorators/query.js';
import type {ReactiveElement} from '../reactive-element.js';

const DEV_MODE = true;

/**
 * Generates a public interface type that removes private and protected fields.
 * This allows accepting otherwise compatible versions of the type (e.g. from
 * multiple copies of the same package in `node_modules`).
 */
type Interface<T> = {
  [K in keyof T]: T[K];
};

export type QueryDecorator = {
  // legacy
  (
    proto: Interface<ReactiveElement>,
    name: PropertyKey
    // Note TypeScript requires the return type to be `void|any`
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ): void | any;

  // standard
  <C extends ReactiveElement, V extends Element>(
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
  return (<C extends ReactiveElement, V extends Element>(
    protoOrTarget: ClassAccessorDecoratorTarget<C, V>,
    nameOrContext: PropertyKey | ClassAccessorDecoratorContext<C, V>
  ) => {
    if (typeof nameOrContext === 'object') {
      return standardQuery(selector, cache)(
        protoOrTarget,
        nameOrContext as ClassAccessorDecoratorContext<C, V>
      );
    } else {
      if (cache) {
        const key = DEV_MODE
          ? Symbol(`${String(nameOrContext)} (@query() cache)`)
          : Symbol();
        Object.defineProperty(protoOrTarget, nameOrContext as PropertyKey, {
          get(this: ReactiveElement) {
            if (
              (this as unknown as {[key: symbol]: Element | null})[key] ===
              undefined
            ) {
              (this as unknown as {[key: symbol]: Element | null})[key] =
                this.renderRoot?.querySelector(selector) ?? null;
            }
            return (this as unknown as {[key: symbol]: Element | null})[key];
          },
          enumerable: true,
          configurable: true,
        });
      } else {
        Object.defineProperty(protoOrTarget, nameOrContext as PropertyKey, {
          get(this: ReactiveElement) {
            return this.renderRoot?.querySelector(selector) ?? null;
          },
          enumerable: true,
          configurable: true,
        });
      }
      return;
    }
  }) as QueryDecorator;
}

// export function query(selector: string, cache?: boolean) {
//   return decorateProperty({
//     descriptor: (name: PropertyKey) => {
//       const descriptor = {
//         get(this: ReactiveElement) {
//           return this.renderRoot?.querySelector(selector) ?? null;
//         },
//         enumerable: true,
//         configurable: true,
//       };
//       if (cache) {
//         const key = DEV_MODE
//           ? Symbol(`${String(name)} (@query() cache)`)
//           : Symbol();
//         descriptor.get = function (this: ReactiveElement) {
//           if (
//             (this as unknown as {[key: symbol]: Element | null})[key] ===
//             undefined
//           ) {
//             (this as unknown as {[key: symbol]: Element | null})[key] =
//               this.renderRoot?.querySelector(selector) ?? null;
//           }
//           return (this as unknown as {[key: symbol]: Element | null})[key];
//         };
//       }
//       return descriptor;
//     },
//   });
// }
