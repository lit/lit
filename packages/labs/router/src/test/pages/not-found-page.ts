/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {LitElement, html} from 'lit';

export class NotFoundPage extends LitElement {
  protected override render(): unknown {
    return html`<h1>404 | Not Found</h1>`;
  }
}

window.customElements.define('not-found-page', NotFoundPage);
