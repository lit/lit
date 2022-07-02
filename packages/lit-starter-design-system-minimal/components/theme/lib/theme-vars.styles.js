/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
import {css} from 'lit';

export const colors = css`
  :host {
    --_primary-color: var(--my-theme-primary-color, #0b57d0);
    --_on-primary-color: var(--my-theme-on-primary-color, #fff);
    --_surface-color: var(--my-theme-surface-color, #fff);
    --_on-surface-color: var(--my-theme-on-surface-color, rgb(31, 31, 31));
    --_disabled-color: var(--my-theme-disabled-color, rgba(31, 31, 31, 0.12));
    --_on-disabled-color: var(
      --my-theme-on-disabled-color,
      rgba(31, 31, 31, 0.38)
    );
  }
`;

export const states = css`
  :host {
    --_state-opacity-disabled: var(--my-theme-state-opacity-disabled, 0.08);
    --_state-opacity-hover: var(--my-theme-state-opacity-hover, 0.08);
    --_state-opacity-focus: var(--my-theme-state-opacity-focus, 0.12);
    --_state-opacity-press: var(--my-theme-state-opacity-press, 0.18);
  }
`;
