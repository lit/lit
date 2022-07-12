/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
import {html, LitElement} from 'lit';
import {property} from 'lit/decorators.js';
import {ClassInfo, classMap} from 'lit/directives/class-map.js';
import {ifDefined} from 'lit/directives/if-defined.js';

export class Button extends LitElement {
  /**
   * The Button's text.
   */
  @property()
  text = '';

  /**
   * Whether or not the button has an icon.
   */
  @property({type: Boolean, attribute: 'has-icon'})
  hasIcon = false;

  /**
   * Whether or not the button is disabled.
   */
  @property({type: Boolean})
  disabled = false;

  /**
   * The Aria label for the button.
   */
  @property()
  label: string | undefined;

  /**
   * Whether or not the icon should follow the text or precede it.
   */
  @property({type: Boolean, attribute: 'trailing-icon'})
  trailingIcon = false;

  override render() {
    return this._renderButton([
      this._renderTouchTarget(),
      this.trailingIcon ? undefined : this._renderIcon(),
      this._renderLabel(),
      this.trailingIcon ? this._renderIcon() : undefined,
    ]);
  }

  protected _renderButton(content: unknown[]) {
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

  protected _onClick(_e: Event) {}

  protected _getButtonClasses(): ClassInfo {
    return {
      hasIcon: this.hasIcon,
      trailingIcon: this.trailingIcon,
    };
  }

  protected _renderIcon() {
    return html`<slot name="icon"></slot>`;
  }

  protected _renderLabel() {
    return html`<span part="label">${this.text}</span>`;
  }

  protected _renderTouchTarget() {
    return html` <div part="touch-target" id="touch"></div> `;
  }
}
