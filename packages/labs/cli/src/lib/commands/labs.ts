/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {AbsolutePath} from '@lit-labs/analyzer/lib/paths.js';
import {Command} from '../command.js';

export const labs: Command = {
  name: 'labs',
  description: 'Experimental commands',
  subcommands: [
    {
      name: 'gen',
      description: 'Generate framework wrappers',
      options: [
        {name: 'packageRoot', defaultValue: './'},
        {name: 'frameworks', multiple: true, defaultValue: ['react']},
      ],
      async run(
        {
          packageRoot,
          frameworks,
        }: {
          packageRoot: AbsolutePath;
          frameworks: string[];
        },
        console: Console
      ) {
        const gen = await import('../generate/generate.js');
        await gen.run({packageRoot, frameworks}, console);
      },
    },
  ],
  async run() {
    console.error(
      'Use one of the labs subcommands, like `lit gen`. ' +
        'Run `lit help gen` for more help.'
    );
  },
};
