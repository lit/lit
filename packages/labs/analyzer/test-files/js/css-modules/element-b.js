/**
 * @license
 * Copyright The Lit Project Authors.
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {LitElement, html} from 'lit';
import styles from '@lit-internal/test-css-styles/button.css' with {type: 'css'};

export class ElementB extends LitElement {
  static styles = styles;

  render() {
    return html`<button>Click me</button>`;
  }
}
