/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
import {css} from 'lit';

export const colors = css`
  :host {
    --_theme-primary-color: var(--theme-primary-color, #0b57d0);
    --_theme-on-primary-color: var(--theme-on-primary-color, #fff);
    --_theme-surface-color: var(--theme-surface-color, #fff);
    --_theme-on-surface-color: var(--theme-on-surface-color, rgb(31, 31, 31));
    --_theme-disabled-color: var(
      --theme-disabled-color,
      rgba(31, 31, 31, 0.12)
    );
    --_theme-on-disabled-color: var(
      --theme-on-disabled-color,
      rgba(31, 31, 31, 0.38)
    );
    --_theme-outline-color: var(--theme-outline-color, #747775);
  }
`;

export const states = css`
  :host {
    --_theme-state-opacity-disabled: var(--theme-state-opacity-disabled, 0.08);
    --_theme-state-opacity-hover: var(--theme-state-opacity-hover, 0.08);
    --_theme-state-opacity-focus: var(--theme-state-opacity-focus, 0.12);
    --_theme-state-opacity-press: var(--theme-state-opacity-press, 0.18);
  }
`;

export const typography = css`
  :host {
    --_theme-typography-font-size-sm: var(
      --theme-typography-font-size-sm,
      0.75rem
    );
    --_theme-typography-font-size-md: var(
      --theme-typography-font-size-md,
      1rem
    );
    --_theme-typography-font-size-lg: var(
      --theme-typography-font-size-lg,
      1.5rem
    );
    --_theme-typography-font-size-xl: var(
      --theme-typography-font-size-lg,
      2rem
    );
  }
`;

export const shape = css`
  :host {
    --_theme-shape-border-radius-sm: var(--theme-shape-border-radius-sm, 4px);
    --_theme-shape-border-radius-md: var(--theme-shape-border-radius-md, 8px);
    --_theme-shape-border-radius-lg: var(--theme-shape-border-radius-lg, 12px);
    --_theme-shape-border-radius-xl: var(--theme-shape-border-radius-xl, 16px);
  }
`;
