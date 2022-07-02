/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
import {css} from 'lit';

export const styles = css`
  #root {
    --_color: var(--my-button-filled-color, var(--_on-primary-color));
    --_color-disabled: var(
      --my-button-filled-color-disabled,
      var(--_on-disabled-color)
    );
    --_background-color: var(
      --my-button-filled-background-color,
      var(--_primary-color)
    );
    --_background-color-disabled: var(
      --my-button-filled-background-color-disabled,
      var(--_disabled-color)
    );
  }

  .button {
    color: var(--_color);
    outline-color: var(--_background-color);
    background-color: var(--_background-color);
  }

  .button[disabled] {
    color: var(--_color-disabled);
    background-color: var(--_background-color-disabled);
  }

  .button::before {
    background-color: var(--_color);
  }
`;
