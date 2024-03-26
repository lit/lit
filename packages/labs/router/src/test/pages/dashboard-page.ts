/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {LitElement, html} from 'lit';

export class DashboardPage extends LitElement {
  protected override render(): unknown {
    return html`
      <h1>Dashboard Page</h1>
      <slot></slot>
    `;
  }
}

window.customElements.define('dashboard-page', DashboardPage);
