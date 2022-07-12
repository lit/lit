/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {ToggleButtonImpl} from './lib/toggle-button.js';
import {styles as sharedStyles} from './lib/button-shared.styles.js';
import {styles as elevationStyles} from './lib/button-elevation.styles.js';
import {styles as filledButtonStyles} from './lib/filled-button.styles.js';
import {styles} from './lib/toggle-button.styles.js';

/**
 * An elevated button that is filled with a color but can toggle between two
 * icons.
 *
 * @cssprop {Length} [--my-button-horizontal-padding=24px] - The horizontal padding of the button.
 * @cssprop {Length} [--my-button-horizontal-icon-padding=8px] - The padding between the icon and the label.
 * @cssprop {Scalar} [--my-button-ripple-opacity-hover=var(--my-theme-state-opacity-hover)] - The opacity of the ripple on hover.
 * @cssprop {Scalar} [--my-button-ripple-opacity-focus=var(--my-theme-state-opacity-focus] - The opacity of the ripple on focus.
 * @cssprop {Scalar} [--my-button-ripple-opacity-press=var(--my-theme-state-opacity-press)] - the opacity of the ripple on press.
 * @cssprop {FontFamily} [--my-button-font-family=sans-serif] - The font family of the button label.
 * @cssprop {Scalar} [--my-button-font-weight=500] - The font-weight of the button label.
 * @cssprop {Length} [--my-button-font-size=0.875rem] - The font-size of the button label.
 * @cssprop {Color} [--my-button-filled-color=var(--my-theme-on-primary-color)] - The text color of the button.
 * @cssprop {Color} [--my-button-filled-color-disabled=var(--my-theme-on-disabled-color)] - The text color of the button when disabled.
 * @cssprop {Color} [--my-button-filled-background-color=var(--my-theme-primary-color)] - The background color of the button.
 * @cssprop {Color} [--my-button-filled-background-color-disabled=var(--my-theme-disabled-color)] - The background color of the button when disabled.
 *
 * @csspart button - The native button element.
 * @csspart label - The text label of the button.
 * @csspart touch-target - The touch target of the button.
 *
 * @slot off - The icon to display when the button is in the 'off' state (default).
 * @slot on - The icon to display when the button is in the 'on' state.
 */
export class ToggleButton extends ToggleButtonImpl {
  static override styles = [
    sharedStyles,
    elevationStyles,
    filledButtonStyles,
    styles,
  ];
}

if (!customElements.get('my-toggle-button')) {
  customElements.define('my-toggle-button', ToggleButton);
}

declare global {
  interface HTMLElementTagNameMap {
    'my-toggle-button': ToggleButton;
  }
}
