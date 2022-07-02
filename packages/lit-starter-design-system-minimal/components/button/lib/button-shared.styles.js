/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
import {css} from 'lit';
import {colors, states} from '../../theme/lib/theme-vars.styles.js';

export const styles = [
  colors,
  states,
  css`
    #root {
      --_padding-x: var(--my-button-horizontal-padding, 24px);
      --_icon-spacing: var(--my-button-horizontal-icon-padding, 8px);
      --_ripple-opacity-hover: var(
        --my-button-ripple-opacity-hover,
        var(--_state-opacity-hover)
      );
      --_ripple-opacity-focus: var(
        --my-button-ripple-opacity-focus,
        var(--_state-opacity-focus)
      );
      --_ripple-opacity-press: var(
        --my-button-ripple-opacity-press,
        var(--_state-opacity-press)
      );
      --_font-family: var(--my-button-font-family, sans-serif);
      --_font-weight: var(--my-button-font-weight, 500);
      --_font-size: var(--my-button-font-size, 0.875rem);
    }

    :host {
      --_height: var(--my-button-height, 38px);
    }

    :host {
      height: var(--_height);
      border-radius: calc(var(--_height) / 2);
      display: inline-flex;
      vertical-align: middle;
    }

    .button {
      display: inherit;
      height: inherit;
      border-radius: inherit;
      align-items: center;
      position: relative;
      padding-inline: var(--_padding-x);
      border: none;
      cursor: pointer;
      z-index: 0;
      outline-offset: 2px;
      font-family: var(--_font-family);
      font-weight: var(--_font-weight);
      font-size: var(--_font-size);
    }

    .button.hasIcon:not(.trailingIcon) {
      padding-inline-start: calc(var(--_padding-x) - var(--_icon-spacing));
    }

    .button.hasIcon.trailingIcon {
      padding-inline-end: calc(var(--_padding-x) - var(--_icon-spacing));
    }

    .button:disabled {
      cursor: default;
    }

    .button::before {
      content: '';
      position: absolute;
      pointer-events: none;
      z-index: -1;
      inset: 0;
      opacity: 0;
      border-radius: inherit;
    }

    .button:hover:not([disabled])::before {
      opacity: var(--_ripple-opacity-hover);
    }

    .button:focus:not([disabled]):where(:not(:focus-visible))::before {
      opacity: var(--_ripple-opacity-focus);
    }

    .button:active:not([disabled])::before {
      opacity: var(--_ripple-opacity-press);
    }

    #touch {
      min-height: 48px;
      min-width: 48px;
      width: 100%;
      position: absolute;
      inset-inline-start: 0px;
    }

    ::slotted(*) {
      width: 18px;
      height: 18px;
      display: inline-flex;
      color: currentColor;
      fill: currentColor;
    }

    :not(.trailingIcon) ::slotted(*) {
      margin-inline-end: var(--_icon-spacing);
    }

    .trailingIcon ::slotted(*) {
      margin-inline-start: var(--_icon-spacing);
    }
  `,
];

export const elevationStyles = css`
  #root {
    --_elevation-hover: var(
      --my-button-box-shadow-hover,
      rgba(0, 0, 0, 0.3) 0px 1px 2px 0px,
      rgba(0, 0, 0, 0.15) 0px 1px 3px 1px
    );
    --_elevation-focus: var(--my-button-box-shadow-focus, transparent);
    --_elevation-press: var(--my-button-box-shadow-press, transparent);
  }

  .button {
    transition: box-shadow 0.28s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .button:not([disabled]):hover {
    box-shadow: var(--_elevation-hover);
  }

  .button:not([disabled]):focus:where(:not(:focus-visible)) {
    box-shadow: var(--_elevation-focus);
  }

  .button:not([disabled]):active {
    box-shadow: var(--_elevation-press);
  }
`;
