/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {LitElement, html, css} from 'lit';

export class ElementB extends LitElement {
  static styles = css`
    :host {
      display: block;
    }
  `;

  static get properties() {
    return {
      foo: {},
      bar: {type: Number},
    };
  }

  constructor() {
    super();
    this.foo = 'hi';
    this.bar = 42;
  }

  render() {
    return html`<h1>${this.foo}</h1>`;
  }
}
