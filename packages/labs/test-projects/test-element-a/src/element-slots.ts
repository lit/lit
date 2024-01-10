/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {LitElement, html} from 'lit';
import {customElement, property} from 'lit/decorators.js';

/**
 * My awesome element
 */
@customElement('element-slots')
export class ElementSlots extends LitElement {
  @property()
  mainDefault = 'mainDefault';

  override render() {
    return html`<h1>Slots</h1>
      <slot name="header"></slot>
      <slot name="main">${this.mainDefault}</slot>
      <slot name="footer"></slot>
      <slot></slot>`;
  }
}
