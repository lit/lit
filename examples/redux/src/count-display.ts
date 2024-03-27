/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {html, LitElement} from 'lit';
import {customElement} from 'lit/decorators.js';
import {select} from '@lit-labs/redux';
import type {RootState} from './store.js';

@customElement('count-display')
export class CountDisplay extends LitElement {
  @select((state: RootState) => state.counter.value)
  _count!: number;

  render() {
    return html`<p>The count is: ${this._count}</p>`;
  }
}
