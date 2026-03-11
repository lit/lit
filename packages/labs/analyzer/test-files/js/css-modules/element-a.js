/**
 * @license
 * Copyright The Lit Project Authors.
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {LitElement, html} from 'lit';
import styles from './element-a.css' with {type: 'css'};

export class ElementA extends LitElement {
  static styles = styles;

  render() {
    return html`<p>Hello CSS Modules</p>`;
  }
}
