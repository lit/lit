/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {stdout} from 'stdout-stderr';
import {suite} from 'uvu';
import * as assert from 'uvu/assert';

import Hello from '../../lib/commands/hello.js';

const helloTest = suite('Hello');

helloTest.before(() => {
  stdout.start();
  stdout.print = true;
});

helloTest.after(() => {
  stdout.stop();
});

helloTest('hello', async () => {
  // Pass empty CLI args so that oclif doesn't try to read the test
  // runner args.
  await Hello.run([]);
  assert.match(stdout.output, 'hello world');
});

helloTest('hello with name', async () => {
  await Hello.run(['--name', 'jeff']);
  assert.match(stdout.output, 'hello jeff');
});

helloTest.run();
