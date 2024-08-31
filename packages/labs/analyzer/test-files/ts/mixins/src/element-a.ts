/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {LitElement, html, css} from 'lit';
import {customElement, property} from 'lit/decorators.js';
import {Highlightable} from './mixins.js';

@customElement('element-a')
export class ElementA extends Highlightable('hi', LitElement) {
  static styles = css`
    :host {
      display: block;
    }
  `;

  @property()
  a?: string;

  @property({reflect: true, type: Number, attribute: 'bbb'})
  b = 1;

  render() {
    return html`<h1>${this.a}</h1>`;
  }
}
