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
import {queryAssignedNodes as standardQueryAssignedNodes} from '../std-decorators/query-assigned-nodes.js';

import type {ReactiveElement} from '../reactive-element.js';

/**
 * Options for the {@linkcode queryAssignedNodes} decorator. Extends the options
 * that can be passed into [HTMLSlotElement.assignedNodes](https://developer.mozilla.org/en-US/docs/Web/API/HTMLSlotElement/assignedNodes).
 */
export interface QueryAssignedNodesOptions extends AssignedNodesOptions {
  /**
   * Name of the slot to query. Leave empty for the default slot.
   */
  slot?: string;
}

/**
 * Generates a public interface type that removes private and protected fields.
 * This allows accepting otherwise compatible versions of the type (e.g. from
 * multiple copies of the same package in `node_modules`).
 */
type Interface<T> = {
  [K in keyof T]: T[K];
};

export type QueryAssignedNodesDecorator = {
  // legacy
  (
    proto: Interface<ReactiveElement>,
    name: PropertyKey
    // Note TypeScript requires the return type to be `void|any`
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ): void | any;

  // standard
  <C extends ReactiveElement, V extends Array<Node>>(
    value: ClassAccessorDecoratorTarget<C, V>,
    context: ClassAccessorDecoratorContext<C, V>
  ): void;
};

// TypeScript requires the decorator return type to be `void|any`.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
// type TSDecoratorReturnType = void | any;

/**
 * A property decorator that converts a class property into a getter that
 * returns the `assignedNodes` of the given `slot`.
 *
 * Can be passed an optional {@linkcode QueryAssignedNodesOptions} object.
 *
 * Example usage:
 * ```ts
 * class MyElement {
 *   @queryAssignedNodes({slot: 'list', flatten: true})
 *   listItems!: Array<Node>;
 *
 *   render() {
 *     return html`
 *       <slot name="list"></slot>
 *     `;
 *   }
 * }
 * ```
 *
 * Note the type of this property should be annotated as `Array<Node>`. Use the
 * queryAssignedElements decorator to list only elements, and optionally filter
 * the element list using a CSS selector.
 *
 * @category Decorator
 */
export function queryAssignedNodes(
  options?: QueryAssignedNodesOptions
): QueryAssignedNodesDecorator {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (<C extends ReactiveElement, V extends Array<Node>>(
    protoOrTarget: ClassAccessorDecoratorTarget<C, V>,
    nameOrContext: PropertyKey | ClassAccessorDecoratorContext<C, V>
  ) => {
    if (typeof nameOrContext === 'object') {
      return standardQueryAssignedNodes(options)(
        protoOrTarget,
        nameOrContext as ClassAccessorDecoratorContext<C, V>
      );
    } else {
      const {slot} = options ?? {};
      Object.defineProperty(protoOrTarget, nameOrContext as PropertyKey, {
        get(this: ReactiveElement) {
          const slotSelector = `slot${
            slot ? `[name=${slot}]` : ':not([name])'
          }`;
          const slotEl =
            this.renderRoot?.querySelector<HTMLSlotElement>(slotSelector);
          return slotEl?.assignedNodes(options) ?? [];
        },
        enumerable: true,
        configurable: true,
      });
      return;
    }
  }) as QueryAssignedNodesDecorator;
}

// export function queryAssignedNodes(
//   options?: QueryAssignedNodesOptions
// ): TSDecoratorReturnType {
//   const slot = options?.slot;
//   const assignedNodesOptions = options;

//   return decorateProperty({
//     descriptor: (_name: PropertyKey) => ({
//       get(this: ReactiveElement) {
//         const slotSelector = `slot${slot ? `[name=${slot}]` : ':not([name])'}`;
//         const slotEl =
//           this.renderRoot?.querySelector<HTMLSlotElement>(slotSelector);
//         return slotEl?.assignedNodes(assignedNodesOptions) ?? [];
//       },
//       enumerable: true,
//       configurable: true,
//     }),
//   });
// }
