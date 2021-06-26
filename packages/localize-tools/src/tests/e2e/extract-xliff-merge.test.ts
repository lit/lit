/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {e2eGoldensTest} from './e2e-goldens-test.js';

e2eGoldensTest('extract-xliff-merge', [
  '--config=lit-localize.json',
  'extract',
]);
