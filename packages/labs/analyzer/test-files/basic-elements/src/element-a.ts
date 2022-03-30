/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {LitElement, html, css} from 'lit';
import {customElement, property} from 'lit/decorators.js';

@customElement('element-a')
export class ElementA extends LitElement {
  static styles = css`
    :host {
      display: block;
    }
  `;

  @property()
  foo?: string;

  render() {
    return html`<h1>${this.foo}</h1>`;
  }
}
