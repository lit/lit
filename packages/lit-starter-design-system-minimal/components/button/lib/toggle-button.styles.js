/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {css} from 'lit';
import {styles as filledButtonStyles} from './filled-button.styles.js';

export const styles = [
  filledButtonStyles,
  css`
    .on slot[name='off'] {
      display: none;
    }

    :not(.on) slot[name='on'] {
      display: none;
    }
  `,
];
