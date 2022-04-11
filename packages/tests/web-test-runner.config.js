/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {wtrConfig} from './wtr-config.js';
import {playwrightLauncher} from '@web/test-runner-playwright';

const LOCAL = 'local';

const requestedBrowsers = process.env.BROWSERS?.trim() || LOCAL;

/***
 * Keep browsers on separate lines to make it easier to comment out
 * individual browsers.
 */
const browserPresets = {
  chromium: {args: ['--js-flags=--expose-gc', '--enable-precise-memory-info']}, //
  firefox: {},
  webkit: {},
};

const browsers = [];
if (browserPresets[requestedBrowsers] !== undefined) {
  browsers.push(
    playwrightLauncher({
      product: requestedBrowsers,
      ...browserPresets[process.env.BROWSERS],
    })
  );
}
if (requestedBrowsers === LOCAL) {
  for (const product in browserPresets) {
    browsers.push(
      playwrightLauncher({
        product,
        ...browserPresets[product],
      })
    );
  }
}

export default {
  ...wtrConfig,
  browsers,
};
