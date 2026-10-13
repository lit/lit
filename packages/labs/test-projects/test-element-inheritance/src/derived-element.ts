/**
 * @license
 * Copyright The Lit Project Contributors.
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {html, css} from 'lit';
import {customElement, property} from 'lit/decorators.js';
import {BaseElement} from './base-element.js';

/**
 * A custom element that extends `BaseElement` in the same package. It
 * declares its own reactive property (`derivedStr`), shadows `aBase` from
 * the base class with a different type, and overrides `baseMethod`.
 *
 * In the `inheritProperties` manifest mode, the non-overridden members
 * from `BaseElement` (e.g. the original `aBase` field if it were not
 * shadowed) would be added to this element's manifest entry with an
 * `inheritedFrom` reference to `BaseElement`. This test verifies that
 * the shadowed members from the base class are NOT inherited and that
 * any new base-class members added in the future will be picked up
 * automatically.
 *
 * @summary Element that extends BaseElement
 */
@customElement('derived-element')
export class DerivedElement extends BaseElement {
  static override styles = css`
    :host {
      display: block;
    }
  `;

  /**
   * A property declared only on the derived element.
   */
  @property({type: String, attribute: 'derived-str'})
  derivedStr = 'derived';

  /**
   * A property that shadows `aBase` from `BaseElement`. The derived
   * declaration should win in the manifest.
   */
  @property({type: Number, attribute: 'a-base'})
  override aBase = 42;

  override render() {
    return html`<p>${this.derivedStr} - ${this.aBase}</p>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'derived-element': DerivedElement;
  }
}
