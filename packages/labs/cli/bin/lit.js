#!/usr/bin/env node

/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {LitCli} from '../lib/lit-cli.js';

// eslint-disable-next-line no-undef
process.on('unhandledRejection', (error) => {
  console.error(`Promise rejection: ${error}`);
  if (error?.stack !== undefined) {
    console.error(error.stack);
  }
  // eslint-disable-next-line no-undef
  process.exit(1);
});

// eslint-disable-next-line no-undef
const args = process.argv.slice(2);
// eslint-disable-next-line no-undef
const cwd = process.cwd();
const cli = new LitCli(args, {cwd});
const result = await cli.run();
// eslint-disable-next-line no-undef
process.exit(result?.exitCode ?? 0);
