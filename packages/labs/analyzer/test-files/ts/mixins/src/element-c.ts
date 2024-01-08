/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {LitElement, html} from 'lit';
import {customElement} from 'lit/decorators.js';
import {C} from './mixins.js';

export const CBase = C(LitElement);

@customElement('element-c')
export class ElementC extends CBase {
  render() {
    return html`<h1>${this.c}</h1>`;
  }
}
