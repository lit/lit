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

export type QueryAssignedNodesDecorator = {
  // legacy
  (
    proto: Interface<ReactiveElement>,
    name: PropertyKey
    // Note TypeScript requires the return type to be `void|any`
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ): void | any;

  // standard
  <C extends Interface<ReactiveElement>, V extends Array<Node>>(
    value: ClassAccessorDecoratorTarget<C, V>,
    context: ClassAccessorDecoratorContext<C, V>
  ): void;
};

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
  return (<C extends Interface<ReactiveElement>, V extends Array<Node>>(
    protoOrTarget: ClassAccessorDecoratorTarget<C, V>,
    nameOrContext: PropertyKey | ClassAccessorDecoratorContext<C, V>
  ) => {
    const {slot} = options ?? {};
    const slotSelector = `slot${slot ? `[name=${slot}]` : ':not([name])'}`;
    const doQuery = (el: Interface<ReactiveElement>) => {
      const slotEl =
        el.renderRoot?.querySelector<HTMLSlotElement>(slotSelector);
      return (slotEl?.assignedNodes(options) ?? []) as unknown as V;
    };
    if (typeof nameOrContext === 'object') {
      return {
        get(this: C): V {
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
  }) as QueryAssignedNodesDecorator;
}
