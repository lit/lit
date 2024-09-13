/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

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
};
