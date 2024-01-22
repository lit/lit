/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import type {Rule, ESLint} from 'eslint';
import {noKevin} from './rules/no-kevin.js';

export const rules = {
  'no-kevin': noKevin as unknown as Rule.RuleModule,
};

export const configs: ESLint.Plugin['configs'] = {
  all: {
    plugins: ['@lit-labs/eslint-plugin'],
    rules: {
      '@lit-labs/no-kevin': 'error',
    },
  },
  recommended: {
    plugins: ['@lit-labs/eslint-plugin'],
    rules: {},
  },
};
