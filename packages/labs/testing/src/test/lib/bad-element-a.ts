/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {LitElement, html} from 'lit';
import {customElement} from 'lit/decorators.js';

@customElement('bad-element-a')
export class BadElementA extends LitElement {
  override render() {
    const paragraphs = document.querySelectorAll('p');
    return html`<span>Count of paragraphs: ${paragraphs.length}</span>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'bad-element-a': BadElementA;
  }
}
