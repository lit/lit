/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {html} from 'lit';
import {ElementB} from './element-b.js';
import {customElement, property} from 'lit/decorators.js';

@customElement('element-c')
export class ElementC extends ElementB {
  @property()
  baz = 'baz';

  render() {
    return html`<h1>${super.render()} ${this.baz}</h1>`;
  }
}
