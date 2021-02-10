/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {LitElement, html} from 'lit-element';
import {msg} from '@lit/localize';
import {Localized} from '@lit/localize/localized-element.js';

export class XGreeter extends Localized(LitElement) {
  render() {
    return html`<p>${msg(html`Hello <b>World</b>!`)}</p>`;
  }
}
customElements.define('x-greeter', XGreeter);
