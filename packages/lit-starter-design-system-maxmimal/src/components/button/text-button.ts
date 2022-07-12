/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {Button} from './lib/button.js';
import {styles as sharedStyles} from './lib/button-shared.styles.js';
import {styles} from './lib/text-button.styles.js';

/**
 * A button that that looks like text and is filled when clicked.
 *
 * @cssprop {Length} [--my-button-horizontal-padding=24px] - The horizontal padding of the button.
 * @cssprop {Length} [--my-button-horizontal-icon-padding=8px] - The padding between the icon and the label.
 * @cssprop {Scalar} [--my-button-ripple-opacity-hover=var(--my-theme-state-opacity-hover)] - The opacity of the ripple on hover.
 * @cssprop {Scalar} [--my-button-ripple-opacity-focus=var(--my-theme-state-opacity-focus] - The opacity of the ripple on focus.
 * @cssprop {Scalar} [--my-button-ripple-opacity-press=var(--my-theme-state-opacity-press)] - the opacity of the ripple on press.
 * @cssprop {FontFamily} [--my-button-font-family=sans-serif] - The font family of the button label.
 * @cssprop {Scalar} [--my-button-font-weight=500] - The font-weight of the button label.
 * @cssprop {Length} [--my-button-font-size=0.875rem] - The font-size of the button label.
 * @cssprop {Color} [--my-button-text-color=var(--my-theme-primary-color)] - The text color of the button.
 * @cssprop {Color} [--my-button-text-color-disabled=var(--my-theme-on-disabled-color)] - The text color of the button when disabled.
 * @cssprop {Color} [--my-button-text-background-color=transparent] - The background color of the button.
 * @cssprop {Color} [--my-button-text-background-color-disabled=transparent] - The background color of the button when disabled.
 *
 * @csspart button - The native button element.
 * @csspart label - The text label of the button.
 * @csspart touch-target - The touch target of the button.
 *
 * @slot icon - The icon to display in the button (make sure to set `hasIcon` to true).
 */
export class TextButton extends Button {
  static override styles = [sharedStyles, styles];
}

if (!customElements.get('my-text-button')) {
  customElements.define('my-text-button', TextButton);
}

declare global {
  interface HTMLElementTagNameMap {
    'my-text-button': TextButton;
  }
}
