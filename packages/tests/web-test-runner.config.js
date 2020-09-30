import { playwrightLauncher } from "@web/test-runner-playwright";
import { fromRollup } from "@web/dev-server-rollup";
import { createSauceLabsLauncher } from "@web/test-runner-saucelabs";
import { legacyPlugin } from "@web/dev-server-legacy";
import { resolveRemap } from "./rollup-resolve-remap.js";
import { prodResolveRemapConfig, devResolveRemapConfig } from "./wtr-config.js";

const mode = process.env.MODE || "dev";
if (!["dev", "prod"].includes(mode)) {
  throw new Error(`MODE must be "dev" or "prod", was "${mode}"`);
}

let resolveRemapConfig;
if (mode === "prod") {
  console.log("Using production builds");
  resolveRemapConfig = prodResolveRemapConfig;
} else {
  console.log("Using development builds");
  resolveRemapConfig = devResolveRemapConfig;
}

const browserPresets = {
  // Default set of Playwright browsers to test when running locally.
  local: ["chromium", "firefox", "webkit"],

  // Browsers to test during automated continuous integration.
  //
  // https://saucelabs.com/platform/supported-browsers-devices
  // https://wiki.saucelabs.com/display/DOCS/Platform+Configurator
  //
  // Many browser configurations don't yet work with @web/test-runner-saucelabs.
  // See https://github.com/modernweb-dev/web/issues/472.
  sauce: [
    "sauce:Windows 10/firefox@68", // Current ESR
    "sauce:Windows 10/chrome@latest-3",
    "sauce:macOS 10.15/safari@latest",
    // "sauce:Windows 10/MicrosoftEdge@18", // Browser start timeout
    // "sauce:Windows 7/internet explorer@11", // Browser start timeout
  ],
};

let sauceLauncher;
function makeSauceLauncherOnce() {
  if (!sauceLauncher) {
    const user = (process.env.SAUCE_USERNAME || "").trim();
    const key = (process.env.SAUCE_ACCESS_KEY || "").trim();
    if (!user || !key) {
      throw new Error(
        "To test on Sauce, set the SAUCE_USERNAME" +
          " and SAUCE_ACCESS_KEY environment variables."
      );
    }
    sauceLauncher = createSauceLabsLauncher({ user, key });
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
function parseBrowser(browser) {
  browser = browser.trim();
  if (!browser) {
    return [];
  }

  if (browser.startsWith("preset:")) {
    const preset = browser.substring("preset:".length);
    const entries = browserPresets[preset];
    if (!entries) {
      throw new Error(
        `Unknown preset "${preset}", please pick one of: ` +
          Object.keys(browserPresets).join(", ")
      );
    }
    return entries.map(parseBrowser).flat();
  }

  if (browser.startsWith("sauce:")) {
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
  sauce:Windows 7/internet explorer@11
  sauce:Linux/chrome@latest-3
  sauce:Linux/firefox@68

See https://wiki.saucelabs.com/display/DOCS/Platform+Configurator for all options.`);
    }
    const [_, platformName, browserName, browserVersion] = match;
    return [
      makeSauceLauncherOnce()({
        browserName,
        browserVersion,
        platformName,
        "sauce:options": {
          name: `lit tests [${mode}]`,
          build: `${process.env.GITHUB_REF ?? "local"} build ${
            process.env.GITHUB_RUN_NUMBER ?? ""
          }`,
        },
      }),
    ];
  }

  return [playwrightLauncher({ product: browser })];
}

const browsers = (process.env.BROWSERS || "preset:local")
  .split(",")
  .map(parseBrowser)
  .flat();

const seenDevModeLogs = new Set();

// https://modern-web.dev/docs/test-runner/cli-and-configuration/
export default {
  rootDir: "../",
  // Note this file list can be overridden by wtr command-line arguments.
  files: [
    "../lit-html/development/**/*_test.js",
    "../lit-element/development/**/*_test.js",
  ],
  nodeResolve: true,
  concurrency: 6, // default cores / 2
  concurrentBrowsers: Number(process.env.CONCURRENT_BROWSERS || 2), // default 2
  browsers,
  plugins: [
    fromRollup(resolveRemap)(resolveRemapConfig),
    // Detect browsers without modules (e.g. IE11) and transform to SystemJS
    // (https://modern-web.dev/docs/dev-server/plugins/legacy/).
    legacyPlugin(),
  ],
  filterBrowserLogs: ({ args }) => {
    if (mode === "dev" && args[0] && args[0].includes("in dev mode")) {
      if (!seenDevModeLogs.has(args[0])) {
        seenDevModeLogs.add(args[0]);
        // Log it one time.
        return true;
      }
      return false;
    }
    return true;
  },
  browserStartTimeout: 60000, // default 30000
  testsStartTimeout: 60000, // default 10000
  testsFinishTimeout: 120000, // default 20000
  testFramework: {
    // https://mochajs.org/api/mocha
    config: {
      ui: "tdd",
      timeout: "60000", // default 2000
    },
  },
};
