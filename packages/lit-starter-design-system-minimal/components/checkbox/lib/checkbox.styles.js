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
      --_checkbox-padding: var(--my-checkbox-padding, 2px);
      --_border-width: var(--my-checkbox-border-width, 2px);
      --_border-radius: var(--my-checkbox-border-radius, 4px);
      --_border-color: var(
        --my-checkbox-border-color,
        var(--_on-surface-color)
      );
      --_border-color-disabled: var(
        --my-checkbox-border-color-disabled,
        var(--_disabled-color)
      );
      --_icon-color: var(--my-checkbox-icon-color, var(--_on-primary-color));
      --_color: var(--my-checkbox-color, var(--_primary-color));
      --_color-disabled: var(
        --my-checkbox-color-disabled,
        var(--_disabled-color)
      );
      --_ripple-opacity-disabled: var(
        --my-checkbox-ripple-opacity-disabled,
        var(--_state-opacity-disabled)
      );
      --_ripple-opacity-hover: var(
        --my-checkbox-ripple-opacity-hover,
        var(--_state-opacity-hover)
      );
      --_ripple-opacity-focus: var(
        --my-checkbox-ripple-opacity-focus,
        var(--_state-opacity-focus)
      );
      --_ripple-opacity-press: var(
        --my-checkbox-ripple-opacity-press,
        var(--_state-opacity-press)
      );
    }

    :host {
      display: inline-flex;
      width: 48px;
      height: 48px;
      border-radius: 50%;
      vertical-align: middle;
    }

    #root {
      position: relative;
      width: inherit;
      height: inherit;
      border-radius: inherit;
    }

    #square {
      border-style: solid;
      border-color: var(--_border-color);
      border-width: var(--_border-width);
      border-radius: var(--_border-radius);
      position: absolute;
      box-sizing: border-box;
      pointer-events: none;
      inset: calc(100% * 5 / 8 / 2);
      padding: var(--_checkbox-padding);
      z-index: 1;
      width: calc(100% * 3 / 8);
      height: calc(100% * 3 / 8);
    }

    .checked #square {
      border-width: 0px;
    }

    svg {
      display: block;
      width: 100%;
      height: 100%;
      color: var(--_icon-color);
    }

    .checked path {
      stroke: currentColor;
      stroke-width: 4;
    }

    input {
      margin: 0;
      border: none;
      appearance: none;
      width: 100%;
      height: 100%;
      border-radius: inherit;
      cursor: pointer;
      outline-offset: 4px;
      outline-color: var(--_color);
    }

    input:disabled {
      cursor: auto;
    }

    .checked #square {
      background-color: var(--_color);
    }

    #ripple {
      opacity: 0;
      pointer-events: none;
      position: absolute;
      inset: 0;
      width: inherit;
      height: inherit;
      border-radius: inherit;
      z-index: 0;
      background-color: var(--_border-color);
    }

    #root:hover #ripple {
      opacity: var(--_ripple-opacity-hover);
    }

    #root:active #ripple {
      opacity: var(--_ripple-opacity-press);
    }

    .checked #ripple {
      background-color: var(--_color);
    }

    #root input:disabled ~ #square {
      border-color: var(--_color-disabled);
    }

    #root.checked input:disabled ~ #square {
      background-color: var(--_color-disabled);
    }

    #root input:disabled ~ #ripple {
      opacity: 0;
    }
  `,
];
