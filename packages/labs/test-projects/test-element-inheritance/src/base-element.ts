/**
 * @license
 * Copyright The Lit Project Contributors.
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {LitElement, html, css} from 'lit';
import {customElement, property} from 'lit/decorators.js';

/**
 * A base custom element used to exercise inheritance-aware manifest
 * generation. It declares a reactive property (`aBase`) and a public
 * method (`baseMethod`) which subclasses may inherit.
 *
 * @summary Base element for inheritance tests
 */
@customElement('base-element')
export class BaseElement extends LitElement {
  static override styles = css`
    :host {
      display: block;
    }
  `;

  /**
   * A reactive property declared on the base class only.
   */
  @property({type: String, attribute: 'a-base'})
  aBase = 'base';

  /**
   * A method declared on the base class only.
   */
  baseMethod() {
    return this.aBase;
  }

  override render() {
    return html`<p>${this.aBase}</p>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'base-element': BaseElement;
  }
}
