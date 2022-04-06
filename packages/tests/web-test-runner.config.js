/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {wtrConfig} from './wtr-config.js';
import {playwrightLauncher} from '@web/test-runner-playwright';

const mode = process.env.MODE || 'dev';
if (!['dev', 'prod'].includes(mode)) {
  throw new Error(`MODE must be "dev" or "prod", was "${mode}"`);
}

const browserPresets = [
  'chromium', // keep browsers on separate lines
  'firefox', // to make it easier to comment out
  'webkit', // individual browsers
];

const browsers = [];
for (const browser of browserPresets) {
  const launchOptions =
    browser === 'chromium'
      ? {args: ['--js-flags=--expose-gc', '--enable-precise-memory-info']}
      : {};

  browsers.push(
    playwrightLauncher({
      product: browser,
      ...launchOptions,
    })
  );
}

export default {
  ...wtrConfig,
  browsers,
};
