/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import baseConfig from '../../tests/web-test-runner.config.js';

import {startServer} from './test/integration/server/server.js';

const ssrServer = startServer();
export default {
  ...baseConfig,
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
