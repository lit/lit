/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import type {ESLint} from 'eslint';

export const rules = {};

export const configs: ESLint.Plugin['configs'] = {
  all: {
    plugins: ['@lit-labs/eslint-plugin'],
    rules: {},
  },
  recommended: {
    plugins: ['@lit-labs/eslint-plugin'],
    rules: {},
  },
};
