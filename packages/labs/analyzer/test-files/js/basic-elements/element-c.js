/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {html} from 'lit';
import {ElementB} from './element-b.js';

export class ElementC extends ElementB {
  static properties = {
    baz: {},
  };

  constructor() {
    super();
    this.baz = 'baz';
  }

  render() {
    return html`<h1>${super.render()} ${this.baz}</h1>`;
  }
}
customElements.define('element-c', ElementC);
