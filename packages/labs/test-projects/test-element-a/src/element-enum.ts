/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {LitElement, html} from 'lit';
import {customElement, property} from 'lit/decorators.js';

// A runtime value referenced by a property type: the wrappers must re-export
// it as a value, not only as a type.
export enum Size {
  small = 'small',
  large = 'large',
}

@customElement('element-enum')
export class ElementEnum extends LitElement {
  @property()
  size: Size = Size.small;

  override render() {
    return html`<span id="size">${this.size}</span>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'element-enum': ElementEnum;
  }
}
