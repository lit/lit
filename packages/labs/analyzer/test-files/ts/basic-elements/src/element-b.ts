/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {LitElement, html, css} from 'lit';
import {customElement, property} from 'lit/decorators.js';

@customElement('element-b')
export class ElementB extends LitElement {
  static styles = css`
    :host {
      display: block;
    }
  `;

  // Adds a property defined in a static properties block to make sure this
  // works in TypeScript as expected
  static get properties() {
    return {
      bar: {type: Number},
    };
  }

  @property()
  foo?: string;

  declare bar: number;

  constructor() {
    super();
    this.bar = 42;
  }

  render() {
    return html`<h1>${this.foo}</h1>`;
  }
}
