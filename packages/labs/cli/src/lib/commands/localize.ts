/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {Command} from '../command.js';

export const localize: Command = {
  name: 'localize',
  description: 'Lit localize',
  subcommands: [
    {
      name: 'extract',
      description: 'Extracts lit-localize messages',
      options: [{name: 'config', defaultValue: './lit-localize.json'}],
      async run({config}: {config: string}, console: Console) {
        const extract = await import('../localize/extract.js');
        await extract.run(config, console);
      },
    },
    {
      name: 'build',
      description: 'Build lit-localize projects',
      options: [{name: 'config', defaultValue: './lit-localize.json'}],
      async run({config}: {config: string}, console: Console) {
        const build = await import('../localize/build.js');
        await build.run(config, console);
      },
    },
  ],
  async run() {
    throw new Error('must use extract or build');
  },
};
