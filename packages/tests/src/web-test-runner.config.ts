/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {createRequire} from 'module';
import {
  playwrightLauncher,
  PlaywrightLauncherArgs,
  ProductType,
} from '@web/test-runner-playwright';
import {createSauceLabsLauncher} from '@web/test-runner-saucelabs';
import {legacyPlugin} from '@web/dev-server-legacy';
import type {BrowserLauncher, TestRunnerConfig} from '@web/test-runner';
import type {PolyfillConfig} from '@web/polyfills-loader';

const mode = process.env.MODE || 'dev';
if (!['dev', 'prod'].includes(mode)) {
  throw new Error(`MODE must be "dev" or "prod", was "${mode}"`);
}

const browserPresets = {
  // Default set of Playwright browsers to test when running locally.
  local: [
    'chromium', // keep browsers on separate lines
    'firefox', // to make it easier to comment out
    'webkit', // individual browsers
  ],

  // Browsers to test during automated continuous integration.
  //
  // https://saucelabs.com/platform/supported-browsers-devices
  // https://wiki.saucelabs.com/display/DOCS/Platform+Configurator
  //
  // Many browser configurations don't yet work with @web/test-runner-saucelabs.
  // See https://github.com/modernweb-dev/web/issues/472.
  sauce: [
    'sauce:Windows 10/Firefox@102', // Current ESR. See: https://wiki.mozilla.org/Release_Management/Calendar
    'sauce:Windows 10/Chrome@latest-2',
    'sauce:macOS 11/Safari@latest',
  ],
};

let sauceLauncher: ReturnType<typeof createSauceLabsLauncher>;

function makeSauceLauncherOnce() {
  if (!sauceLauncher) {
    const user = (process.env.SAUCE_USERNAME || '').trim();
    const key = (process.env.SAUCE_ACCESS_KEY || '').trim();
    if (!user || !key) {
      throw new Error(
        'To test on Sauce, set the SAUCE_USERNAME' +
          ' and SAUCE_ACCESS_KEY environment variables.'
      );
    }
    sauceLauncher = createSauceLabsLauncher({
      user,
      key,
    });
  }
  return sauceLauncher;
}

/**
 * Recognized formats:
 *
 *   - "browser"
 *     Local playwright
 *     E.g. "chromium", "firefox"
 *
 *   - "sauce:os/browser@version"
 *     Sauce Labs
 *     E.g. "sauce:macOS 10.15/safari@latest"
 *
 *   - "preset:name"
 *     Expand one of the preset sets of browsers
 *     E.g. "preset:local", "preset:sauce"
 */
function parseBrowser(browser: string): Array<BrowserLauncher> {
  browser = browser.trim();
  if (!browser) {
    return [];
  }

  if (browser.startsWith('preset:')) {
    const preset = browser.substring(
      'preset:'.length
    ) as keyof typeof browserPresets;
    const entries = browserPresets[preset];
    if (!entries) {
      throw new Error(
        `Unknown preset "${preset}", please pick one of: ` +
          Object.keys(browserPresets).join(', ')
      );
    }
    return entries.map(parseBrowser).flat();
  }

  if (browser.startsWith('sauce:')) {
    // Note this is the syntax used by WCT. Might as well use the same one.
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
  sauce:Linux/chrome@latest-2
  sauce:Linux/firefox@91

See https://wiki.saucelabs.com/display/DOCS/Platform+Configurator for all options.`);
    }
    const [, platformName, browserName, browserVersion] = match;
    return [
      makeSauceLauncherOnce()({
        browserName,
        browserVersion,
        platformName,
        'sauce:options': {
          name: `lit tests [${mode}]`,
          build: `${process.env.GITHUB_REF ?? 'local'} build ${
            process.env.GITHUB_RUN_NUMBER ?? ''
          }`,
        },
      }),
    ];
  }

  const config: PlaywrightLauncherArgs = {
    product: browser as ProductType,
    ...(browser === 'chromium'
      ? {
          launchOptions: {
            args: ['--js-flags=--expose-gc', '--enable-precise-memory-info'],
          },
        }
      : {}),
  };
  return [playwrightLauncher(config)];
}

const browsers = (process.env.BROWSERS || 'preset:local')
  .split(',')
  .map(parseBrowser)
  .flat();

const require = createRequire(import.meta.url);

// https://modern-web.dev/docs/test-runner/cli-and-configuration/
const config: TestRunnerConfig = {
  // Serve from the root of the monorepo, because most dependencies are hoisted
  // into its node_modules folder. Usually this wouldn't matter, because wtr
  // will serve node modules from outside the root automatically, however our
  // HTML tests use hard-coded paths to load the polyfills, so the automatic
  // node resolution doesn't apply there.
  rootDir: '../../',
  // Note this file list can be overridden by wtr command-line arguments.
  files: [
    '../labs/context/development/**/*_test.(js|html)',
    '../labs/motion/development/**/*_test.(js|html)',
    '../labs/observers/development/**/*_test.(js|html)',
    '../labs/router/development/**/*_test.js',
    '../labs/scoped-registry-mixin/development/**/*_test.(js|html)',
    '../labs/task/development/**/*_test.(js|html)',
    '../context/development/**/*_test.(js|html)',
    '../task/development/**/*_test.(js|html)',
    '../lit-element/development/**/*_test.(js|html)',
    '../lit-html/development/**/*_test.(js|html)',
    '../reactive-element/development/**/*_test.(js|html)',
  ],
  nodeResolve: {
    exportConditions: mode === 'dev' ? ['development'] : [],
  },
  concurrency: Number(process.env.CONCURRENT_FRAMES || 6), // default cores / 2
  concurrentBrowsers: Number(process.env.CONCURRENT_BROWSERS || 3), // default 3
  browsers,
  plugins: [
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
            // TODO(justinfagnani): this isn't in the PolyfillConfig type?
            module: false,
          } as PolyfillConfig,
        ],
      },
    }),
  ],
  // Only actually log errors. This helps make test output less spammy.
  filterBrowserLogs: ({type}) => type === 'error',
  middleware: [
    /**
     * Ensures that when we're in dev mode we only load dev sources, and when
     * we're in prod mode we only load prod sources.
     *
     * The most common way to get an error here is to have a relative import in
     * a /test/ module (e.g. `import '../lit-element.js'`). A bare module should
     * instead always be used in test modules (e.g. `import 'lit-element'`). The
     * bare module is necessary, even for imports from the same package, so that
     * export conditions take effect.
     */
    function devVsProdSourcesChecker(context, next) {
      if (mode === 'dev') {
        if (
          context.url.includes('/packages/') &&
          !context.url.includes('/development/') &&
          // For compiled tests
          !context.url.includes('/compiled/') &&
          // lit and labs/testing don't have a dev mode
          !context.url.includes('/packages/lit/') &&
          !context.url.includes('/packages/labs/testing/') &&
          // some 3rd party modules can come from e.g. /packages/node_modules/*
          !context.url.includes('/node_modules/')
        ) {
          console.log('Unexpected prod request in dev mode:', context.url);
          context.response.status = 403;
          return;
        }
      } else {
        if (
          context.url.includes('/packages/') &&
          context.url.includes('/development/') &&
          // test are always served from /development/
          !context.url.includes('/development/test/')
        ) {
          console.log('Unexpected dev request in prod mode:', context.url);
          const refererHeader = context.req.headers['referer'];
          if (refererHeader) {
            // Try and extract the <filename>_test.js from the referer.
            const maybeTestFile = /[\w-]*_test\.js/.exec(refererHeader)?.[0];
            if (maybeTestFile) {
              console.log(
                `❌ There may be a relative import in '${maybeTestFile}' which ` +
                  `is resolving to '${context.url}'. Ensure the import is a bare module. ` +
                  'Reproduce locally with: ' +
                  '`MODE=prod npm run test:common -w @lit-internal/tests`'
              );
            }
          }
          context.response.status = 403;
          return;
        }
      }
      return next();
    },
  ],
  browserStartTimeout: 60000, // default 30000
  testsFinishTimeout: 600000, // default 20000
  testFramework: {
    // https://mochajs.org/api/mocha
    config: {
      ui: 'tdd',
      timeout: '60000', // default 2000
    },
  },
};

export default config;
