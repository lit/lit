import { playwrightLauncher } from '@web/test-runner-playwright';

export default {
  browsers: [
    playwrightLauncher({ product: 'chromium' }),
    // playwrightLauncher({ product: 'firefox' }),
    // playwrightLauncher({ product: 'webkit' }),
  ],
  testFramework: {
    config: {
      ui: 'tdd',
      timeout: '2000',
    },
  },
};
