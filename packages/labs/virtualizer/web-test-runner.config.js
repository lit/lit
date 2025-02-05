/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {chromeLauncher} from '@web/test-runner-chrome';

export default {
  concurrency: 1,
  testFramework: {
    config: {
      ui: 'bdd',
      timeout: '2000',
      // TODO(usergenic): Why does rootHooks not seem to register the beforeEach/afterEach hooks?
      // I was hoping to register the ResizeObserver error ignore hooks here but the hook functions
      // here don't appear to do anything.
      rootHooks: [],
    },
  },
  browsers: [
    chromeLauncher({
      async createPage({context}) {
        const page = await context.newPage();
        await page.evaluateOnNewDocument(provideSkipInCI, process.env.CI);
        return page;
      },
    }),
  ],
};

function provideSkipInCI(CI) {
  // We're extending Mocha's describe function, so
  // need to wait until Mocha has loaded
  addEventListener('load', () => {
    // eslint-disable-next-line no-undef
    const {describe} = globalThis;
    describe.skipInCI = (title, fn) => {
      if (CI) {
        describe.skip(title, fn);
      } else {
        describe(title, fn);
      }
    };
  });
}
