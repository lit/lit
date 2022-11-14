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
 */
customElements.define('lit-virtualizer', LitVirtualizer);

declare global {
  interface HTMLElementTagNameMap {
    'lit-virtualizer': LitVirtualizer;
  }
}
