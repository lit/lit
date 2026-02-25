/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {LitElement, html} from 'lit';
import {customElement, property} from 'lit/decorators.js';

/**
 * My awesome element
 *
 * @slot tab-<id>-icon - A dynamic slot for icons
 */
@customElement('element-slots')
export class ElementSlots extends LitElement {
  @property()
  mainDefault = 'mainDefault';

  @property({type: Array})
  tabs: Array<{id: string; title: string}> = [];

  override render() {
    return html`<h1>Slots</h1>
      <slot name="header"></slot>
      <slot name="main">${this.mainDefault}</slot>
      <slot name="footer"></slot>
      <slot name="tab-title-0"></slot>
      <slot name="tab-<id>-icon"></slot>
      <slot></slot>`;
  }
}
