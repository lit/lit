/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import localConfig from '../../tests/web-test-runner.config.js';
import {startServer} from './test/integration/server/server.js';

let config = localConfig;
if (process.env.DESTINATION === 'remote') {
  config = await import('../../tests/web-test-runner.remote.config.js');
}

const ssrServer = startServer();
export default {
  ...config,
  files: ['test/integration/client/**/*_test.js'],
  nodeResolve: {
    exportConditions: process.env.MODE === 'dev' ? ['development'] : [],
  },
  middleware: [
    async (ctx, next) => {
      await ssrServer;
      return next();
    },
  ],
};
