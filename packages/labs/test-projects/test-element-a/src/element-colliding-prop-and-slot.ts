/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {LitElement, html} from 'lit';
import {customElement, property} from 'lit/decorators.js';

/**
 * Element with a slot/property name collision for wrapper generator tests.
 * @slot content - Named slot that collides with `content` property after Svelte name mapping.
 */
@customElement('element-colliding-prop-and-slot')
export class ElementCollidingPropAndSlot extends LitElement {
  @property({type: String})
  content = 'default-content';

  override render() {
    return html`<slot name="content"></slot>`;
  }
}
