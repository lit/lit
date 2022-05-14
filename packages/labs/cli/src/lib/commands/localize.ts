/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {ResolvedCommand, CommandOptions} from '../command.js';

export const localize: ResolvedCommand = {
  kind: 'resolved',
  name: 'localize',
  description: 'Lit localize',
  subcommands: [
    {
      kind: 'resolved',
      name: 'extract',
      description: 'Extracts lit-localize messages',
      options: [
        {
          name: 'config',
          description: 'The path to the localize config file',
          defaultValue: './lit-localize.json',
        },
      ],
      async run({config}: {config: string}, console: Console) {
        const extract = await import('../localize/extract.js');
        await extract.run(config, console);
      },
    },
    {
      kind: 'resolved',
      name: 'build',
      description: 'Build lit-localize projects',
      options: [
        {
          name: 'config',
          description: 'The path to the localize config file',
          defaultValue: './lit-localize.json',
        },
      ],
      async run({config}: {config: string}, console: Console) {
        const build = await import('../localize/build.js');
        await build.run(config, console);
      },
    },
  ],
  async run(_options: CommandOptions, console: Console) {
    console.error(
      'Use one of the localize subcommands, like `lit localize build` or ' +
        '`lit localize extract`. Run `lit help localize` for more help.'
    );
    return {
      exitCode: 1,
    };
  },
};
