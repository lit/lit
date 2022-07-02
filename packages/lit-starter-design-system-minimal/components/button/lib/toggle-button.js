/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
import {html} from 'lit';
import {Button} from './button.js';

/**
 * @fires toggle - Fired when the button is toggled via user interaction.
 */
export class ToggleButtonImpl extends Button {
  static get properties() {
    return {
      ...super.properties,
      /**
       * Toggles between displaying the on and off icons.
       */
      on: {type: Boolean},
    };
  }

  constructor() {
    super();
    this.on = false;
    this.hasIcon = true;
  }

  _getButtonClasses() {
    return {
      ...super._getButtonClasses(),
      hasIcon: true,
      on: this.on,
    };
  }

  _renderIcon() {
    return html`
      <slot name="on"></slot>
      <slot name="off"></slot>
    `;
  }

  _onClick() {
    this.on = !this.on;
    this.dispatchEvent(new Event('toggle'));
  }
}
