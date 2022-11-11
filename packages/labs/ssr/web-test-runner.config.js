/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import baseConfig from '../../tests/web-test-runner.config.js';

import {ssrMiddleware} from './test/integration/server/server.js';

export default {
  ...baseConfig,
  files: ['test/integration/client/**/basic-global_test.js'],
  nodeResolve: {
    exportConditions: process.env.MODE === 'dev' ? ['development'] : [],
  },
  middleware: [...ssrMiddleware()],
};
