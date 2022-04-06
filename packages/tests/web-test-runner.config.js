/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {wtrConfig} from './wtr-config.js';
import {playwrightLauncher} from '@web/test-runner-playwright';

const browserPresets = {
  chromium: {args: ['--js-flags=--expose-gc', '--enable-precise-memory-info']}, // keep browsers on separate lines
  firefox: {}, // to make it easier to comment out
  webkit: {}, // individual browsers
};

const mode = process.env.MODE || 'dev';
if (!['dev', 'prod'].includes(mode)) {
  throw new Error(`MODE must be "dev" or "prod", was "${mode}"`);
}

const requestedBrowsers = process.env.BROWSERS.trim() || 'local';
const browsers = [];
if (browserPresets[requestedBrowsers] !== undefined) {
  const launchOptions = browserPresets[process.env.BROWSERS];
  browsers.push(
    playwrightLauncher({
      product: requestedBrowsers,
      ...launchOptions,
    })
  );
}
if (process.env.BROWSERS === 'local') {
  for (const product of browserPresets) {
    const launchOptions = browserPresets[product];
    browsers.push(
      playwrightLauncher({
        product,
        ...launchOptions,
      })
    );
  }
}

export default {
  ...wtrConfig,
  browsers,
};
