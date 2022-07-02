/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
import {html, LitElement} from 'lit';
import {classMap} from 'lit/directives/class-map.js';
import {ifDefined} from 'lit/directives/if-defined.js';

export class Button extends LitElement {
  static get properties() {
    return {
      /**
       * The Button's text.
       */
      text: {type: String},
      /**
       * Whether or not the button has an icon.
       */
      hasIcon: {type: Boolean, attribute: 'has-icon'},
      /**
       * Whether or not the button is disabled.
       */
      disabled: {type: Boolean},
      /**
       * The Aria label for the button.
       */
      label: {type: String},
      /**
       * Whether or not the icon should follow the text or precede it.
       */
      trailingIcon: {type: Boolean, attribute: 'trailing-icon'},
    };
  }

  constructor() {
    super();
    this.text = '';
    this.hasIcon = false;
    this.disabled = false;
    this.trailingIcon = false;
  }

  render() {
    return this._renderButton([
      this._renderTouchTarget(),
      this.trailingIcon ? undefined : this._renderIcon(),
      this._renderLabel(),
      this.trailingIcon ? this._renderIcon() : undefined,
    ]);
  }

  _renderButton(content) {
    const buttonClasses = this._getButtonClasses();
    return html`
      <button
        id="root"
        part="button"
        class="button ${classMap(buttonClasses)}"
        aria-label=${ifDefined(this.label)}
        .hasIcon=${this.hasIcon}
        ?disabled=${this.disabled}
        @click=${this._onClick}
      >
        ${content}
      </button>
    `;
  }

  _onClick(_e) {}

  _getButtonClasses() {
    return {
      hasIcon: this.hasIcon,
      trailingIcon: this.trailingIcon,
    };
  }

  _renderIcon() {
    return html`<slot name="icon"></slot>`;
  }

  _renderLabel() {
    return html`<span part="label">${this.text}</span>`;
  }

  _renderTouchTarget() {
    return html` <div part="touch-target" id="touch"></div> `;
  }
}
