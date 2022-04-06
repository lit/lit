/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {wtrConfig} from './wtr-config.js';
import {createSauceLabsLauncher} from '@web/test-runner-saucelabs';
import {process} from 'node';

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

/**
 * Recognized formats:
 *      sauce:os/browser@version
 *      E.g. "sauce:macOS 10.15/safari@latest"
 */
const browserPresets = {
  // Browsers to test during automated continuous integration.
  //
  // https://saucelabs.com/platform/supported-browsers-devices
  // https://wiki.saucelabs.com/display/DOCS/Platform+Configurator
  //
  // Many browser configurations don't yet work with @web/test-runner-saucelabs.
  // See https://github.com/modernweb-dev/web/issues/472.
  sauce: [
    'sauce:Windows 10/Firefox@78', // Current ESR. See: https://wiki.mozilla.org/Release_Management/Calendar
    'sauce:Windows 10/Chrome@latest-3',
    'sauce:macOS 10.15/Safari@latest',
    // 'sauce:Windows 10/MicrosoftEdge@18', // needs globalThis polyfill
  ],
  'sauce-ie11': ['sauce:Windows 10/Internet Explorer@11'],
};

const user = (process.env.SAUCE_USERNAME || '').trim();
const key = (process.env.SAUCE_ACCESS_KEY || '').trim();
const tunnelIdentifier = (process.env.SAUCE_TUNNEL || '').trim();

if (!user || !key || !tunnelIdentifier) {
  throw new Error(`
To test on Sauce, set the following env variables
- SAUCE_USERNAME
- SAUCE_ACCESS_KEY
- TUNNEL_IDENTIFIER
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

const browserList = browserPresets[process.env.BROWSERS ?? 'sauce'];
const browsers = [];
for (const browser of browserList) {
  const match = browser.match(/^sauce:(.+)\/(.+)@(.+)$/);
  if (!match) {
    throw new Error(`
Invalid Sauce browser string.
Expected format "sauce:os/browser@version".
Provided string was "${browser}".

Valid examples:

sauce:macOS 10.15/safari@13
sauce:Windows 10/MicrosoftEdge@18
sauce:Windows 10/internet explorer@11
sauce:Linux/chrome@latest-3
sauce:Linux/firefox@78

See https://wiki.saucelabs.com/display/DOCS/Platform+Configurator for all options.
        `);
  }
  const [, platformName, browserName, browserVersion] = match;
  browsers.push(
    sauceLauncher({
      browserName,
      browserVersion,
      platformName,
    })
  );
}

// https://modern-web.dev/docs/test-runner/cli-and-configuration/
export default {
  ...wtrConfig,
  browsers,
  files,
};
