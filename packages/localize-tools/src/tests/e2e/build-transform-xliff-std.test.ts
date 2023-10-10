/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {e2eGoldensTest} from './e2e-goldens-test.js';

e2eGoldensTest('build-transform-xliff-std', [
  '--config=lit-localize.json',
  'build',
]);
