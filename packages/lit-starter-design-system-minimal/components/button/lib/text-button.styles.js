/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
import {css} from 'lit';

export const styles = css`
  #root {
    --_color: var(--my-button-text-color, var(--_primary-color));
    --_disabled-color: var(
      --my-button-text-color-disabled,
      var(--_on-disabled-color)
    );
    --_background-color: var(--my-button-text-background-color, transparent);
    --_background-color-disabled: var(
      --my-button-text-background-color-disabled,
      transparent
    );
  }

  .button {
    color: var(--_color);
    outline-color: var(--color);
    background-color: var(--_background-color);
  }

  .button[disabled] {
    color: var(--_disabled-color);
    background-color: var(--_background-color-disabled);
  }

  .button::before {
    background-color: var(--_color);
  }
`;
