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

import {decorateProperty} from './base.js';
import {queryAssignedElements} from './query-assigned-elements.js';

import type {ReactiveElement} from '../reactive-element.js';

/**
 * Options for the {@linkcode queryAssignedNodes} decorator. Extends the options
 * that can be passed into [slot.assignedNodes](https://developer.mozilla.org/en-US/docs/Web/API/HTMLSlotElement/assignedNodes).
 */
export interface QueryAssignedNodesOptions extends AssignedNodesOptions {
  /**
   * Name of the slot to query. Leave empty for the default slot.
   */
  slot?: string;
}

// TypeScript requires the decorator return type to be `void|any`.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type TSDecoratorReturnType = void | any;

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
 *   listItems!: Array<HTMLElement>;
 *
 *   render() {
 *     return html`
 *       <slot name="list"></slot>
 *     `;
 *   }
 * }
 * ```
 *
 * Note the type of this property should be annotated as `Array<Node>`.
 *
 * @category Decorator
 */
export function queryAssignedNodes(
  options?: QueryAssignedNodesOptions
): TSDecoratorReturnType;

/**
 * A property decorator that converts a class property into a getter that
 * returns the `assignedNodes` of the given named `slot`.
 *
 * Example usage:
 * ```ts
 * class MyElement {
 *   @queryAssignedNodes('list', true, '.item')
 *   listItems!: Array<HTMLElement>;
 *
 *   render() {
 *     return html`
 *       <slot name="list"></slot>
 *     `;
 *   }
 * }
 * ```
 *
 * Note the type of this property should be annotated as `Array<Node>` if used
 * without a `selector` or `Array<HTMLElement>` if a selector is provided.
 * Use {@linkcode queryAssignedElements @queryAssignedElements} to
 * list only elements, and optionally filter the element list using a CSS selector. 
 *
 * @param slotName A string name of the slot.
 * @param flatten A boolean which when true flattens the assigned nodes,
 *     meaning any assigned nodes that are slot elements are replaced with their
 *     assigned nodes.
 * @param selector A CSS selector used to filter the elements returned.
 *
 * @category Decorator
 * @deprecated Prefer passing in a single options object, i.e. `{slot: 'list'}`.
 * If using `selector` please use `@queryAssignedElements`.
 * `@queryAssignedNodes('', false, '.item')` is functionally identical to
 * `@queryAssignedElements({slot: '', flatten: false, selector: '.item'})` or
 * `@queryAssignedElements({selector: '.item'})`.
 */
export function queryAssignedNodes(
  slotName?: string,
  flatten?: boolean,
  selector?: string
): TSDecoratorReturnType;

export function queryAssignedNodes(
  slotOrOptions?: string | QueryAssignedNodesOptions,
  flatten?: boolean,
  selector?: string
) {
  // Normalize the overloaded arguments.
  let slot = slotOrOptions;
  let assignedNodesOptions: AssignedNodesOptions;
  if (typeof slotOrOptions === 'object') {
    slot = slotOrOptions.slot;
    assignedNodesOptions = slotOrOptions;
  } else {
    assignedNodesOptions = {flatten};
  }

  // For backwards compatibility, queryAssignedNodes with a selector behaves
  // exactly like queryAssignedElements with a selector.
  if (selector) {
    return queryAssignedElements({
      slot: slot as string,
      flatten,
      selector,
    });
  }

  return decorateProperty({
    descriptor: (_name: PropertyKey) => ({
      get(this: ReactiveElement) {
        const slotSelector = `slot${slot ? `[name=${slot}]` : ':not([name])'}`;
        const slotEl =
          this.renderRoot?.querySelector<HTMLSlotElement>(slotSelector);
        return slotEl?.assignedNodes(assignedNodesOptions) ?? [];
      },
      enumerable: true,
      configurable: true,
    }),
  });
}
