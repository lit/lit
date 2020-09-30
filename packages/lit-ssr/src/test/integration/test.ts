/**
 * @license
 * Copyright (c) 2020 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at
 * http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at
 * http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
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
    description: 'Runs karma in debug mode without opening a webdriver-controlled browser',
    defaultValue: false
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
    mocha: {ui: 'tdd'}
  },
  files: [
    {
      pattern: 'test/integration/client/**/*_test.js',
      type: 'module'
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
} as any);

if (args.debug) {
  config.browsers = [];
  config.singleRun = false;
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
