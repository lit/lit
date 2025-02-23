/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {RuleTester} from '@typescript-eslint/rule-tester';
import {describe as suite, test} from 'node:test';

const fixtureRootDir = new URL('../../fixture', import.meta.url).pathname;

RuleTester.afterAll = () => {};

RuleTester.describe = suite;

RuleTester.it = test;

export const ruleTester = new RuleTester({
  parser: '@typescript-eslint/parser',
  parserOptions: {
    tsconfigRootDir: fixtureRootDir,
    project: './tsconfig.json',
  },
});
