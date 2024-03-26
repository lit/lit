/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {LitElement, html, css} from 'lit';
import {Highlightable} from './mixins.js';

export class ElementA extends Highlightable('hi', LitElement) {
  static styles = css`
    :host {
      display: block;
    }
  `;

  static properties = {
    a: {type: String},
    b: {reflect: true, type: Number, attribute: 'bbb'},
  };

  constructor() {
    super();
    this.b = 1;
  }

  render() {
    return html`<h1>${this.a}</h1>`;
  }
}
customElements.define('element-a', ElementA);
