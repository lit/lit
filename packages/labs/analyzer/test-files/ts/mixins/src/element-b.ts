/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {LitElement, html} from 'lit';
import {customElement} from 'lit/decorators.js';
import {A, B, C} from './mixins.js';

// Dummy values passed into mixins
const x = () => 'x';
const y = () =>
  class {
    z = 'hi';
  };
const z = () => y();

@customElement('element-b')
export class ElementB extends A(x(), B('hi', y(), C(LitElement)), z()) {
  render() {
    return html`<h1>${this.a} ${this.b} ${this.c}</h1>`;
  }
}
