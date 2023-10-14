/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {LitElement, html} from 'lit';
import {customElement} from 'lit/decorators.js';

/**
 * My awesome element
 */
@customElement('element-without-props')
export class ElementWithoutProps extends LitElement {
  override render() {
    return html`foo`;
  }
}
