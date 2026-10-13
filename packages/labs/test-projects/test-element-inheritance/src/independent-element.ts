/**
 * @license
 * Copyright The Lit Project Contributors.
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {LitElement, html, css} from 'lit';
import {customElement, property} from 'lit/decorators.js';

/**
 * A custom element with no inheritance relationship to the other test
 * elements. Used to verify that inheritance walking does not affect
 * elements without an ancestor in the same package.
 *
 * @summary An independent element
 */
@customElement('independent-element')
export class IndependentElement extends LitElement {
  static override styles = css`
    :host {
      display: block;
    }
  `;

  @property({type: String, attribute: 'independent-str'})
  independentStr = 'independent';

  override render() {
    return html`<p>${this.independentStr}</p>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'independent-element': IndependentElement;
  }
}
