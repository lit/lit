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
const tunnelIdentifier = process.env.SAUCE_TUNNEL_ID?.trim() || '';
const buildId = process.env.SAUCE_BUILD_ID?.trim() || '';
const requestedBrowsers = process.env.BROWSERS?.trim().split(',') || [SAUCE];

if (!user || !key || !tunnelIdentifier || !buildId) {
  throw new Error(`
To test on Saucelabs, set the following env variables:
- SAUCE_USERNAME
- SAUCE_ACCESS_KEY
- SAUCE_TUNNEL_ID
- SAUCE_BUILD_ID
  `);
}

/***
 * Some package tests should be run externally in Saucelabs.
 * When a package requires remote testing, add it to the list below.
 */
const files = [
  '../labs/observers/development/**/*_test.(js|html)',
  '../labs/react/development/**/*_test.(js|html)',
  '../labs/router/development/**/*_test.js',
  '../labs/scoped-registry-mixin/development/**/*_test.(js|html)',
  '../labs/ssr/development/**/*_test.(js|html)',
  '../labs/task/development/**/*_test.(js|html)',
  '../lit-element/development/**/*_test.(js|html)',
  '../lit-html/development/**/*_test.(js|html)',
  '../reactive-element/development/**/*_test.(js|html)',
];

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

/***
 * Shared tunnels are 'high availablity' tunnels at Saucelabs
 *
 * Tunnels are generally meant to run 1 test suite. However, Lit runs
 * 50+ test files. Saucelabs recommends a shared tunnel for this use case.
 * When multiple tests use the same tunnel, a tunnel collision occurs.
 * When tunnel requests collide, the most recent is favored and the previous
 * is dropped.
 *
 * By using a `tunnelIdentifier` alongside `noRemoveCollidingTunnels` and
 * `sharedTunnel` properties in the SauceLabsLauncher config, tests will
 * avoid tunnel collisions.
 *
 * To read more go to:
 * https://docs.saucelabs.com/secure-connections/sauce-connect/setup-configuration/high-availability/
 *
 */
const build = `${buildId}__${mode}__${requestedBrowsers.join('_')}`;

const sauceLauncher = createSauceLabsLauncher(
  {
    user,
    key,
  },
  {
    build,
  },
  {
    noRemoveCollidingTunnels: true,
    sharedTunnel: true,
    tunnelIdentifier,
  }
);

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
  files,
  browserStartTimeout: 240000, // default 30000
  // For ie11 where tests run more slowly, this timeout needs to be long
  // enough so that blocked tests have time to wait for all previous test files
  // to run to completion.
  testsStartTimeout: 240000, // default 120000
  testsFinishTimeout: 240000, // default 20000
};
