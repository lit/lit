/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {wtrConfig} from './wtr-config.js';
import {playwrightLauncher} from '@web/test-runner-playwright';

const LOCAL = 'preset:local';

/***
 * Environment variables required to run local tests
 */
const requestedBrowsers = process.env.BROWSERS?.trim().split(',') || [LOCAL];

/***
 * Keep browsers on separate lines to make it easier to comment out
 * individual browsers.
 */
const browserPresets = {
  chromium: {args: ['--js-flags=--expose-gc', '--enable-precise-memory-info']}, //
  firefox: {},
  webkit: {},
};

/**
 * Build browser launchers
 */
const browsers = [];
for (const requestedBrowser of requestedBrowsers) {
  // example: BROWSERS=chromium,firefox npm run test
  if (browserPresets[requestedBrowser] !== undefined) {
    browsers.push(
      playwrightLauncher({
        product: requestedBrowser,
        ...browserPresets[process.env.BROWSERS],
      })
    );
  }
  // example: BROWSERS=preset:local npm run test
  if (requestedBrowser === LOCAL) {
    for (const product in browserPresets) {
      browsers.push(
        playwrightLauncher({
          product,
          ...browserPresets[product],
        })
      );
    }
  }
}

// https://modern-web.dev/docs/test-runner/cli-and-configuration/
export default {
  ...wtrConfig,
  browsers,
};
