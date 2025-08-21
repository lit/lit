/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {LitElement, html} from 'lit';
import {customElement} from 'lit/decorators.js';
import './external-element.d.ts';

@customElement('x-foo')
export class XFoo extends LitElement {
  render() {
    return html`<slot></slot>`;
  }
}

export const templateA = html`
  <x-foo></x-foo>
  <external-element></external-element>
`;
