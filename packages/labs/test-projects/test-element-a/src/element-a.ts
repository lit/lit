/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {LitElement, html, css} from 'lit';
import {customElement, property} from 'lit/decorators.js';

/**
 * My awesome element
 * @fires a-changed - An awesome event to fire
 */
@customElement('element-a')
export class ElementA extends LitElement {
  static override styles = css`
    :host {
      display: block;
    }
  `;

  @property()
  foo?: string;

  xkevin = 'hi';

  override render() {
    return html`<h1>${this.foo}</h1>`;
  }
}
