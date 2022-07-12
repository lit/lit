/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
import {html} from 'lit';
import {property} from 'lit/decorators.js';
import {Button} from './button.js';

/**
 * @fires toggle - Fired when the button is toggled via user interaction.
 */
export class ToggleButtonImpl extends Button {
  /**
   * Toggles between displaying the on and off icons.
   */
  @property({type: Boolean})
  on = false;

  @property({type: Boolean})
  override hasIcon = true;

  override _getButtonClasses() {
    return {
      ...super._getButtonClasses(),
      hasIcon: true,
      on: this.on,
    };
  }

  override _renderIcon() {
    return html`
      <slot name="on"></slot>
      <slot name="off"></slot>
    `;
  }

  override _onClick() {
    this.on = !this.on;
    this.dispatchEvent(new Event('toggle'));
  }
}
