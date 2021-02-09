/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import karma from 'karma';
import testingKarma from '@open-wc/testing-karma';
import deepmerge from 'deepmerge';

import {startServer} from './server/server.js';
import cliArgs from 'command-line-args';

const options = [
  {
    name: 'debug',
    type: Boolean,
    alias: 'd',
    description:
      'Runs karma in debug mode without opening a webdriver-controlled browser',
    defaultValue: false,
  },
];

const args = cliArgs(options);

const {Server} = karma;
const {createDefaultConfig} = testingKarma;

/*
 * This module starts a SSR test server and Karma, and shuts them down when
 * finished.
 */

const config: karma.ConfigOptions = deepmerge(createDefaultConfig({}), {
  frameworks: ['mocha', 'chai'],
  client: {
    mocha: {ui: 'tdd'},
  },
  files: [
    {
      pattern: 'test/integration/client/**/*_test.js',
      type: 'module',
    },
  ],
  proxies: {
    // TODO: use a dynamic port
    '/test': 'http://localhost:9090/test',
  },
  // See the karma-esm docs for all options
  esm: {
    nodeResolve: true,
    preserveSymlinks: true,
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
} as any);

if (args.debug) {
  config.browsers = [];
  config.singleRun = false;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (config as any).client.mocha.timeout = 100000000;
}

(async () => {
  const ssrServer = await startServer();
  const karmaServer = new Server(config, (exitCode) => {
    console.log(`Karma has exited with ${exitCode}`);
    ssrServer.close();
    process.exit(exitCode);
  });
  karmaServer.start();
})();
