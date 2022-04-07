/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import * as pathLib from 'path';
import {fileURLToPath} from 'url';
import {fromRollup} from '@web/dev-server-rollup';
import {legacyPlugin} from '@web/dev-server-legacy';
import {resolveRemap} from './rollup-resolve-remap.js';
import {createRequire} from 'module';

const packagesDir = pathLib.resolve(
  pathLib.dirname(fileURLToPath(import.meta.url)),
  '..'
);

/**
 * rollup-resolve-remap config that remaps any lit-html or lit-element imports
 * to their minified production versions (works for both bare and path module
 * specifiers).
 */
const prodResolveRemapConfig = {
  root: packagesDir,
  remap: [
    // The development/test/ directories are special, there are no production
    // versions of these.
    {from: 'lit-html/development/test/', to: null},
    {from: 'lit-element/development/test/', to: null},
    {from: 'reactive-element/development/test/', to: null},
    // Remap any other development/ modules up one level to the production
    // version.
    {from: 'lit-html/development/', to: 'lit-html/'},
    {from: 'lit-element/development/', to: 'lit-element/'},
    {from: 'reactive-element/development/', to: 'reactive-element/'},
  ],
};

/**
 * rollup-resolve-remap config that remaps any lit-html or lit-element imports
 * to the un-minified development versions.
 */
const devResolveRemapConfig = {
  root: packagesDir,
  remap: [
    // Don't remap external dependencies.
    {from: 'lit-html/node_modules/', to: null},
    {from: 'lit-element/node_modules/', to: null},
    {from: 'reactive-element/node_modules/', to: null},
    // If we're already reaching into development/, nothing to change.
    {from: 'lit-html/development/', to: null},
    {from: 'lit-element/development/', to: null},
    {from: 'reactive-element/development/', to: null},
    // Everything else is a production version; remap to the development
    // version.
    {from: 'lit-html/', to: 'lit-html/development/'},
    {from: 'lit-element/', to: 'lit-element/development/'},
    {from: 'reactive-element/', to: 'reactive-element/development/'},
  ],
};

const mode = process.env.MODE || 'dev';
if (!['dev', 'prod'].includes(mode)) {
  throw new Error(`MODE must be "dev" or "prod", was "${mode}"`);
}

let resolveRemapConfig;
if (mode === 'prod') {
  console.log('Using production builds');
  resolveRemapConfig = prodResolveRemapConfig;
} else {
  console.log('Using development builds');
  resolveRemapConfig = devResolveRemapConfig;
}

const require = createRequire(import.meta.url);

// https://modern-web.dev/docs/test-runner/cli-and-configuration/
const wtrConfig = {
  rootDir: '../',
  // Note `{files: []}` can be overridden by wtr command-line arguments.
  files: [],
  nodeResolve: true,
  concurrency: Number(process.env.CONCURRENT_FRAMES || 1),
  concurrentBrowsers: Number(process.env.CONCURRENT_BROWSERS || 1),
  plugins: [
    fromRollup(resolveRemap)(resolveRemapConfig),
    // Detect browsers without modules (e.g. IE11) and transform to SystemJS
    // (https://modern-web.dev/docs/dev-server/plugins/legacy/).
    legacyPlugin({
      polyfills: {
        // Rather than use the webcomponents polyfill version bundled with the
        // legacyPlugin, we inject a custom version of the polyfill; this both
        // gives us more control over the version, but also allows a mechanism
        // for tests to opt out of automatic injection, so that they can control
        // the timing when the polyfill loads (i.e. for setting polyfill flags
        // in an inline script before polyfills are manually loaded). Note that
        // .html-based tests can add a `<meta name="manual-polyfills">` tag in
        // the head to opt out of automatic polyfill injection and load them
        // manually using a `<script>` tag in the page.
        webcomponents: false,
        custom: [
          {
            name: 'webcomponents-2.5.0',
            path: require.resolve(
              '@webcomponents/webcomponentsjs/webcomponents-bundle.js'
            ),
            // Don't load if the page is tagged with a special meta indicating
            // the polyfills will be loaded manually
            test: '!document.querySelector("meta[name=manual-polyfills]")',
            module: false,
          },
        ],
      },
    }),
  ],
  // Only actually log errors and warnings. This helps make test output less spammy.
  filterBrowserLogs: (type) => type === 'warn' || type === 'error',
  browserStartTimeout: 60000, // default 30000
  // For ie11 where tests run more slowly, this timeout needs to be long
  // enough so that blocked tests have time to wait for all previous test files
  // to run to completion.
  testsStartTimeout: 180000 * 10, // default 120000
  testsFinishTimeout: 180000, // default 20000
  testFramework: {
    // https://mochajs.org/api/mocha
    config: {
      ui: 'tdd',
      timeout: '60000', // default 2000
    },
  },
};

export {wtrConfig};
