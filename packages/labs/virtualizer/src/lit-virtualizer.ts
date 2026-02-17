/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {LitVirtualizer} from './LitVirtualizer.js';
export {LitVirtualizer};
export {RangeChangedEvent, VisibilityChangedEvent} from './events.js';

/**
 * Import this module to declare the lit-virtualizer custom element.
 * Safe to import multiple times; the element is only registered once.
 */
LitVirtualizer.define();

declare global {
  interface HTMLElementTagNameMap {
    'lit-virtualizer': LitVirtualizer;
  }
}
