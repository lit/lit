/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {LitElement, html} from 'lit';
import {Highlightable} from './mixins.js';

export class ElementWithNonIdentBase extends [Highlightable][0](
  'hi',
  LitElement
) {
  render() {
    return html`Boo!`;
  }
}
