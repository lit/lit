/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {Command} from '../command.js';

export const labs: Command = {
  name: 'labs',
  description: 'Experimental commands',
  subcommands: [
    {
      name: 'gen',
      description: 'Generate framework wrappers',
      options: [
        {
          name: 'package',
          multiple: true,
          defaultValue: './',
          description: 'Folder containing a package to generate wrappers for.',
        },
        {
          name: 'framework',
          multiple: true,
          description:
            'Framework to generate wrappers for. Supported frameworks: react.',
        },
      ],
      async run(
        {
          package: packages,
          framework: frameworks,
        }: {
          package: string[];
          framework: string[];
        },
        console: Console
      ) {
        const gen = await import('../generate/generate.js');
        await gen.run({packages, frameworks}, console);
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
