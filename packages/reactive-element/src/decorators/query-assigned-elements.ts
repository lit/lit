/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

/*
 * IMPORTANT: For compatibility with tsickle and the Closure JS compiler, all
 * property decorators (but not class decorators) in this file that have
 * an @ExportDecoratedItems annotation must be defined as a regular function,
 * not an arrow function.
 */

import {ReactiveElement} from '../reactive-element.js';
import {decorateProperty} from './base.js';

export interface QueryAssignedElementsOptions extends AssignedNodesOptions {
  /**
   * A string name of the slot. Leave empty for the default slot.
   */
  slotName?: string;
  /**
   * A string which filters the results to elements that match the given css
   * selector.
   */
  selector?: string;
}

/**
 * A property decorator that converts a class property into a getter that
 * returns the `assignedElements` of the given `slot`. Provides a declarative
 * way to use
 * [`slot.assignedElements`](https://developer.mozilla.org/en-US/docs/Web/API/HTMLSlotElement/assignedElements).
 *
 * @param options Object that sets options for nodes to be returned. See
 *     [MDN parameters section](https://developer.mozilla.org/en-US/docs/Web/API/HTMLSlotElement/assignedElements#parameters)
 *     for available options. Also accepts two more optional properties,
 *     `slotName` and `selector`.
 * @param options.slotName Name of the slot. Undefined or empty string for the
 *     default slot.
 * @param options.selector Element results are filtered such that they match the
 *     given css selector.
 *
 * ```ts
 * class MyElement {
 *   @queryAssignedElements({ slotName: 'list' })
 *   listItems;
 *   @queryAssignedElements()
 *   unnamedSlotEls;
 *
 *   render() {
 *     return html`
 *       <slot name="list"></slot>
 *       <slot></slot>
 *     `;
 *   }
 * }
 * ```
 * @category Decorator
 */
export function queryAssignedElements(options?: QueryAssignedElementsOptions) {
  const {slotName, selector} = options ?? {};
  return decorateProperty({
    descriptor: (_name: PropertyKey) => ({
      get(this: ReactiveElement) {
        const slotSelector = `slot${
          slotName ? `[name=${slotName}]` : ':not([name])'
        }`;
        const slot = this.renderRoot?.querySelector(slotSelector);
        const elements = (slot as HTMLSlotElement).assignedElements(options);
        if (selector) {
          return elements.filter((node) => node.matches(selector));
        }
        return elements;
      },
      enumerable: true,
      configurable: true,
    }),
  });
}
