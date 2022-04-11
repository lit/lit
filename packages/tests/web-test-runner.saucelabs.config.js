/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {wtrConfig, mode, PROD} from './wtr-config.js';
import {createSauceLabsLauncher} from '@web/test-runner-saucelabs';

const SAUCE = 'sauce';
const SAUCE_IE11 = 'sauce-ie11';

/***
 * Environment variables required to run saucelabs tests
 */
const user = process.env.SAUCE_USERNAME?.trim() || '';
const key = process.env.SAUCE_ACCESS_KEY?.trim() || '';
const tunnelIdentifier = process.env.SAUCE_TUNNEL_ID?.trim() || '';

if (!user || !key || !tunnelIdentifier) {
  throw new Error(`
To test on Sauce, set the following env variables
- SAUCE_USERNAME
- SAUCE_ACCESS_KEY
- SAUCE_TUNNEL_ID
  `);
}

/***
 * Some package tests should be run externally in Saucelabs.
 * When a package requires remote testing, add it to the list below.
 */
const devFiles = [
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

/***
 * Not all packages have production requirements. If a package should be
 * tested in production, add its tests to the list below.
 */
const prodFiles = [
  '../labs/ssr/development/**/*_test.(js|html)',
  '../lit-element/development/**/*_test.(js|html)',
  '../lit-html/development/**/*_test.(js|html)',
  '../reactive-element/development/**/*_test.(js|html)',
];

const browserSettings = {
  chromium: {
    browserName: 'chrome',
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
  IE: {
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
const sauceLauncher = createSauceLabsLauncher(
  {
    user,
    key,
  },
  {
    build: tunnelIdentifier,
  },
  {
    noRemoveCollidingTunnels: true,
    sharedTunnel: true,
    tunnelIdentifier,
  }
);

let browsers;
// example: BROWSERS=chromium npm run tests
if (browserSettings[process.env.BROWSERS] !== undefined) {
  browsers = [sauceLauncher(browserSettings[process.env.BROWSERS])];
}
// example: BROWSERS=sauce-ie11 npm run tests
if (process.env.BROWSERS === SAUCE_IE11) {
  browsers = [sauceLauncher(browserSettings.IE)];
}
// example: BROWSERS=sauce npm run tests
if (process.env.BROWSERS === SAUCE) {
  browsers = [
    sauceLauncher(browserSettings.chromium),
    sauceLauncher(browserSettings.firefox),
    sauceLauncher(browserSettings.safari),
  ];
}

const files = mode === PROD ? prodFiles : devFiles;

// https://modern-web.dev/docs/test-runner/cli-and-configuration/
export default {
  ...wtrConfig,
  browsers,
  files,
};
