/**
 * 
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

 {legacyPlugin}  '@web/dev-server-legacy';
 {playwrightLauncher}  '@web/test-runner-playwright';

// Uncomment testing Sauce Labs
// Must run `npm i --save-dev @web/test-runner-saucelabs`
// SAUCE_USERNAME SAUCE_USERNAME environment variables
// ===========
//  {createSauceLabsLauncher}  '@web/test-runner-saucelabs';
//  sauceLabsLauncher  createSauceLabsLauncher(
//   {
//     user: process.env.SAUCE_USERNAME,
//     key: process.env.SAUCE_USERNAME,
//   },
//   {
//     'sauce:options': {
//       name: 'unit tests',
//       build: `${process.env.GITHUB_REF ?? 'local'} build ${
//         process.env.GITHUB_RUN_NUMBER ?? ''
//       }`,
//     },
//   }
// );

// Uncomment  testing  BrowserStack
// Must  `npm i --save-dev @web/test-runner-browserstack`
// BROWSER_STACK_USERNAME  BROWSER_STACK_ACCESS_KEY environment variables
// ===========
//  {browserstackLauncher createBrowserstackLauncher} '@web/test-runner-browserstack';
//  browserstackLauncher  (config) => createBrowserstackLauncher({
//   capabilities: {
//     'browserstack.user': process.env.BROWSER_STACK_USERNAME,
//     'browserstack.key': process.env.BROWSER_STACK_ACCESS_KEY,
//     project: 'my-element',
//     name: 'unit tests',
//     build: `${process.env.GITHUB_REF ?? 'local'} build ${
//       process.env.GITHUB_RUN_NUMBER ?? ''
//     }`,
//     ...config,
//   }
// });

 browsers = {
  // Local browser testing playwright
  // ===========
  chromium: playwrightLauncher({product: 'chromium'}),
  firefox: playwrightLauncher({product: 'firefox'}),
  webkit: playwrightLauncher({product: 'webkit'}),

  // Uncomment example launchers running Sauce Labs
  // ===========
  // chromium: sauceLabsLauncher({browserName: 'chrome', browserVersion: 'latest', platformName: 'Windows 10'}),
  // firefox: sauceLabsLauncher({browserName: 'firefox', browserVersion: 'latest', platformName: 'Windows 10'}),
  // edge: sauceLabsLauncher({browserName: 'MicrosoftEdge', browserVersion: 'latest', platformName: 'Windows 10'}),
  // ie11: sauceLabsLauncher({browserName: 'internet explorer', browserVersion: '11.0', platformName: 'Windows 10'}),
  // safari: sauceLabsLauncher({browserName: 'safari', browserVersion: 'latest', platformName: 'macOS 10.15'}),

  // Uncomment example launchers running Sauce Labs
  // ===========
  // chromium: browserstackLauncher({browserName: 'Chrome', os: 'Windows', os_version: '10'}),
  // firefox: browserstackLauncher({browserName: 'Firefox', os: 'Windows', os_version: '10'}),
  // edge: browserstackLauncher({browserName: 'MicrosoftEdge', os: 'Windows', os_version: '10'}),
  // ie11: browserstackLauncher({browserName: 'IE', browser_version: '11.0', os: 'Windows', os_version: '10'}),
  // safari: browserstackLauncher({browserName: 'Safari', browser_version: '14.0', os: 'OS X', os_version: 'Big Sur'}),
};

// Prepend BROWSERS=x,y `npm run test` subset browsers
// e.g. `BROWSERS=chromium,firefox npm  `
 noBrowser = (b) => {
   Error(`No browser configured named '${b}'; using defaults`);
};
 commandLineBrowsers;
   {
  commandLineBrowsers = process.env.BROWSERS?.split(',').map(
    (b) => browsers[b] ?? noBrowser(b)
  );
}  (e) {
  console.warn(e);
}

// https://modern-web.dev/docs/test-runner/cli-and-configuration/
 {
  rootDir: '.',
  files: ['./test/**/*_test.js'],
  nodeResolve: ,
  preserveSymlinks: ,
  browsers: commandLineBrowsers ?? Object.values(browsers),
  testFramework: {
    // https://mochajs.org/api/mocha
    config: {
      ui: 'tdd',
    },
  },
  plugins: [
    // Detect browsers without modules (e.g. IE11) and transform to SystemJS
    // (https://modern-web.dev/docs/dev-server/plugins/legacy/).
    legacyPlugin({
      polyfills: {
        webcomponents: ,
        // Inject lit's polyfill-support module files, required
        // interfacing webcomponents polyfills
        custom: [
          {
            name: 'lit-polyfill-support',
            path: 'node_modules/lit/polyfill-support.js',
            test: "!('attachShadow' in Element.prototype) || !('getRootNode' in Element.prototype) || window.ShadyDOM && window.ShadyDOM.force",
            module: ,
          },
        ],
      },
    }),
  ],
};
