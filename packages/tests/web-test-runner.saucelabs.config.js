/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {wtrConfig, mode} from './wtr-config.js';
import {createSauceLabsLauncher} from '@web/test-runner-saucelabs';

const SAUCE = 'preset:sauce';

/***
 * Environment variables required to run saucelabs tests
 */
const user = process.env.SAUCE_USERNAME?.trim() || '';
const key = process.env.SAUCE_ACCESS_KEY?.trim() || '';
const requestedBrowsers = process.env.BROWSERS?.trim().split(',') || [SAUCE];

if (!user || !key) {
  throw new Error(`
 To test on Saucelabs, set the following env variables:
 - SAUCE_USERNAME
 - SAUCE_ACCESS_KEY
 - SAUCE_TUNNEL_ID
 - SAUCE_BUILD_ID
   `);
}

const browserSettings = {
  chromium: {
    browserName: 'Chrome',
    browserVersion: 'latest-3',
    platformName: 'Windows 10',
  },
  firefox: {
    browserName: 'Firefox',
    browserVersion: '78',
    platformName: 'Windows 10',
  },
  safari: {
    browserName: 'Safari',
    browserVersion: 'latest',
    platformName: 'macOS 10.15',
  },
  ie: {
    browserName: 'Internet Explorer',
    browserVersion: '11',
    platformName: 'Windows 10',
  },
};

const sauceLauncher = createSauceLabsLauncher({
  user,
  key,
});

/**
 * Build browser launchers
 */
const browsers = [];
for (const requestedBrowser of requestedBrowsers) {
  // example: BROWSERS=chromium,firefox npm run tests
  if (browserSettings[requestedBrowser] !== undefined) {
    browsers.push(sauceLauncher(browserSettings[requestedBrowser]));
  }
  // example: BROWSERS=preset:sauce npm run tests
  if (requestedBrowser === SAUCE) {
    browsers.push(sauceLauncher(browserSettings.chromium));
    browsers.push(sauceLauncher(browserSettings.firefox));
    browsers.push(sauceLauncher(browserSettings.safari));
  }
}

// https://modern-web.dev/docs/test-runner/cli-and-configuration/
export default {
  ...wtrConfig,
  browsers,
  browserStartTimeout: 240000,
  testsStartTimeout: 240000,
  testsFinishTimeout: 240000,
};
