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
  a?: string;

  @property({reflect: true, type: Number, attribute: 'bbb'})
  b = 1;

  @property()
  c;

  static c = 'should not be inferred as type for c';

  render() {
    return html`<h1>${this.a}</h1>`;
  }
}
