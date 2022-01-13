/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {LitElement, html} from 'lit';
import {msg} from '@lit/localize';

export class XGreeter extends LitElement {
  render() {
    return html`<p>${msg(html`Hello <b>World</b>!`)}</p>`;
  }
}
customElements.define('x-greeter', XGreeter);
