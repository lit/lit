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

import type {ReactiveElement} from '../reactive-element.js';

export interface QueryAssignedNodesOptions extends AssignedNodesOptions {
  /**
   * Name of the slot. Leave empty for the default slot.
   */
  slot?: string;
  /**
   * CSS selector used to filter the elements returned.
   */
  selector?: string;
}

// TypeScript requires the decorator return type to be `void|any`.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type TSDecoratorReturnType = void | any;

/**
 * A property decorator that converts a class property into a getter that
 * returns the `assignedNodes` of the given `slot`.
 *
 * Example usage:
 * ```ts
 * class MyElement {
 *   @queryAssignedNodes({slot: 'list', flatten: true, selector: '.item'})
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
 *
 * @param options Object that sets options for nodes to be returned. See
 *     [MDN parameters section](https://developer.mozilla.org/en-US/docs/Web/API/HTMLSlotElement/assignedNodes#parameters)
 *     for available options. Also accepts two more optional properties,
 *     `slot` and `selector`.
 * @param options.slot Name of the slot. Undefined or empty string for the
 *     default slot.
 * @param options.selector A CSS selector used to filter the elements returned.
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
 *
 * @param slotName A string name of the slot.
 * @param flatten A boolean which when true flattens the assigned nodes,
 *     meaning any assigned nodes that are slot elements are replaced with their
 *     assigned nodes.
 * @param selector A CSS selector used to filter the elements returned.
 *
 * @category Decorator
 * @deprecated Prefer passing in a single options object, i.e. `{slot: 'list'}`.
 */
export function queryAssignedNodes(
  slotName?: string,
  flatten?: boolean,
  selector?: string
): TSDecoratorReturnType;

export function queryAssignedNodes(
  arg0?: string | QueryAssignedNodesOptions,
  arg1?: boolean,
  arg2?: string
) {
  const {slot = '', selector = ''} =
    typeof arg0 === 'object' ? arg0 : {slot: arg0 ?? '', selector: arg2 ?? ''};
  const assignedNodesOpts =
    typeof arg1 === 'boolean'
      ? {flatten: arg1}
      : typeof arg0 === 'object'
      ? arg0
      : undefined;

  return decorateProperty({
    descriptor: (_name: PropertyKey) => ({
      get(this: ReactiveElement) {
        const slotSelector = `slot${slot ? `[name=${slot}]` : ':not([name])'}`;
        const slotEl =
          this.renderRoot?.querySelector<HTMLSlotElement>(slotSelector);
        let nodes = slotEl?.assignedNodes(assignedNodesOpts) ?? [];
        if (selector) {
          nodes = nodes.filter(
            (node) =>
              node.nodeType === Node.ELEMENT_NODE &&
              (node as Element).matches(selector)
          );
        }
        return nodes;
      },
      enumerable: true,
      configurable: true,
    }),
  });
}
