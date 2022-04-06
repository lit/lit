/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {wtrConfig} from './wtr-config.js';
import {createSauceLabsLauncher} from '@web/test-runner-saucelabs';

/***
 * Below is a list of tests that will run externally in Saucelabs.
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

const user = (process.env.SAUCE_USERNAME || '').trim();
const key = (process.env.SAUCE_ACCESS_KEY || '').trim();
const tunnelIdentifier = (process.env.SAUCE_TUNNEL_ID || '').trim();

if (!user || !key || !tunnelIdentifier) {
  throw new Error(`
To test on Sauce, set the following env variables
- SAUCE_USERNAME
- SAUCE_ACCESS_KEY
- SAUCE_TUNNEL_ID
  `);
}

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

let browsers = [];
if (process.env.BROWSERS === 'sauce-ie11') {
  browsers = [
    sauceLauncher({
      browserName: 'Internet Explorer',
      browserVersion: '11',
      platformName: 'Windows 10',
    }),
  ];
}
if (process.env.BROWSERS === 'sauce') {
  browsers = [
    sauceLauncher({
      browserName: 'chrome',
      browserVersion: 'latest-3',
      platformName: 'Windows 10',
    }),
    sauceLauncher({
      browserName: 'Firefox',
      browserVersion: '78',
      platformName: 'Windows 10',
    }),
    sauceLauncher({
      browserName: 'Safari',
      browserVersion: 'latest',
      platformName: 'Windows 10',
    }),
  ];
}

// https://modern-web.dev/docs/test-runner/cli-and-configuration/
export default {
  ...wtrConfig,
  browsers,
  files,
};
