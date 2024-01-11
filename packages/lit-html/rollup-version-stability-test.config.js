/**
 * @license
 * Copyright 2018 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {defaultConfig} from './rollup.config.js';

export default defaultConfig({
  outputDir: './version-stability-build/',
  testPropertyPrefix: 'VERSION_TEST_',
  copyHtmlTests: false,
  // Don't emit polyfill-support.js from this test
  bundled: [],
});
