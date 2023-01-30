/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {LitElement, html, css, PropertyValues} from 'lit';
import {customElement, property} from 'lit/decorators.js';

@customElement('test-element')
export class TestElement extends LitElement {
  static override styles = css`
    h1 {
      color: red;
    }
  `;

  @property()
  name = 'World';

  override render() {
    console.log('element render');
    return html`<h1>Hello ${this.name}!</h1>`;
  }

  override update(changedProperties: PropertyValues) {
    console.log('element update');
    super.update(changedProperties);
  }
}
