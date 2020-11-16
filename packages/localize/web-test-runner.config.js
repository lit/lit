import {playwrightLauncher} from '@web/test-runner-playwright';

// https://modern-web.dev/docs/test-runner/cli-and-configuration/
export default {
  rootDir: '.',
  files: ['./tests/**/*.test.js'],
  nodeResolve: true,
  browsers: [
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
};
