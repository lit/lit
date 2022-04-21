#!node

/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {LitCli} from '../lib/lit-cli.js';

process.on('uncaughtException', (error: null | undefined | Partial<Error>) => {
  console.error(`Uncaught exception: ${error}`);
  if (error?.stack !== undefined) {
    console.error(error.stack);
  }
  process.exit(1);
});

process.on('unhandledRejection', (error: null | undefined | Partial<Error>) => {
  console.error(`Promise rejection: ${error}`);
  if (error?.stack !== undefined) {
    console.error(error.stack);
  }
  process.exit(1);
});

const args = process.argv.slice(2);
const cli = new LitCli(args);
await cli.run();
