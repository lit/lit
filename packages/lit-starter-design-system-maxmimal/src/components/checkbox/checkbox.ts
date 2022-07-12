/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
import {CheckboxImpl} from './lib/checkbox.js';
import {styles} from './lib/checkbox.styles.js';

/**
 * A custom Checkbox component.
 *
 * @cssprop {Length} [--my-checkbox-padding=2px] - Internal padding of the checkbox.
 * @cssprop {Length} [--my-checkbox-border-width=2px] - Width of the checkbox's border.
 * @cssprop {Length} [--my-checkbox-border-radius=4px] - Border radius of the checkbox's border.
 * @cssprop {Color} [--my-checkbox-color=var(--my-primary-color)] - Color of the checkbox fill when selected.
 * @cssprop {Color} [--my-checkbox-color-disabled=var(--my-disabled-color)]] - Color of the checkbox fill when disabled.
 * @cssprop {Color} [--my-checkbox-icon-color=var(--my-on-primary-color)] - Color of the checkbox icon.
 * @cssprop {Color} [--my-checkbox-border-color=var(--my-disabled-color)] - Color of the checkbox border.
 * @cssprop {Color} [--my-checkbox-border-color-disabled=var(--my-disabled-color)] - Color of the checkbox border when disabled.
 * @cssprop {Scalar} [--my-checkbox-ripple-opacity-disabled=var(--my-state-opacity-disabled)] - Opacity of the ripple when disabled.
 * @cssprop {Scalar} [--my-checkbox-ripple-opacity-hover=var(--my-state-opacity-hover)] - Opacity of the ripple when hovered.
 * @cssprop {Scalar} [--my-checkbox-ripple-opacity-focus=var(--my-state-opacity-focus)] - Opacity of the ripple when focused.
 * @cssprop {Scalar} [--my-checkbox-ripple-opacity-press=var(--my-state-opacity-press)] - Opacity of the ripple when press.
 *
 * @csspart input - The native input element.
 * @csspart square - The square that is filled in when checked.
 * @csspart ripple - The the activity ripple.
 */
export class Checkbox extends CheckboxImpl {
  static override styles = [styles];
}

if (!customElements.get('my-checkbox')) {
  customElements.define('my-checkbox', Checkbox);
}

declare global {
  interface HTMLElementTagNameMap {
    'my-checkbox': Checkbox;
  }
}
