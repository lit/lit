/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {LitElement, html} from 'lit';
import {customElement, property} from 'lit/decorators.js';

@customElement('count-display')
export class CountDisplay extends LitElement {
  @property({type: Number}) declare count: number;

  constructor() {
    super();
    this.count = 0;
  }

  render() {
    return html`<p>Count: ${this.count}</p>`;
  }
}
