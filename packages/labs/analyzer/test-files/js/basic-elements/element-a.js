/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {LitElement, html, css} from 'lit';

export class ElementA extends LitElement {
  static styles = css`
    :host {
      display: block;
    }
  `;

  static properties = {
    a: {},
    b: {reflect: true, type: Number, attribute: 'bbb'},
    c: {},
  };

  static c = 'should not be inferred as type for c';

  constructor() {
    super();
    this.a = '';
    this.b = 1;
  }

  render() {
    return html`<h1>${this.a}</h1>`;
  }
}
customElements.define('element-a', ElementA);
