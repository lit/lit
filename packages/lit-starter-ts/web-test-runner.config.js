import {playwrightLauncher} from '@web/test-runner-playwright';
import {legacyPlugin} from '@web/dev-server-legacy';

let commandLineBrowsers;
try {
  commandLineBrowsers = process.env.BROWSERS?.split(',').map((b) =>
    playwrightLauncher({product: b})
  );
} catch {
  console.warn(`BROWSER ${process.env.BROWSERS} unknown; using defaults`);
}

// https://modern-web.dev/docs/test-runner/cli-and-configuration/
export default {
  rootDir: '.',
  files: ['./test/**/*_test.js'],
  nodeResolve: true,
  preserveSymlinks: true,
  browsers: commandLineBrowsers ?? [
    playwrightLauncher({product: 'chromium'}),
    playwrightLauncher({product: 'firefox'}),
    playwrightLauncher({product: 'webkit'}),
  ],
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
        webcomponents: true,
      },
    }),
  ],
};
