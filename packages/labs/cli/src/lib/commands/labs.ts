/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {Command} from '../command.js';
import {LitCli} from '../lit-cli.js';

export const makeLabsCommand = (cli: LitCli): Command => {
  return {
    kind: 'resolved',
    name: 'labs',
    description: 'Experimental commands',
    subcommands: [
      {
        kind: 'resolved',
        name: 'gen',
        description: 'Generate framework wrappers',
        options: [
          {
            name: 'package',
            multiple: true,
            defaultValue: './',
            description:
              'Folder containing a package to generate wrappers for. For TypeScript projects, if the package folder does not contain a tsconfig.json, this option may also specify a specific tsconfig.json to use.',
          },
          {
            name: 'framework',
            multiple: true,
            description:
              'Framework to generate wrappers for. Supported frameworks: react, vue.',
          },
          {
            name: 'manifest',
            type: Boolean,
            description:
              'Generate a custom-elements.json manifest for this package.',
          },
          {
            name: 'out',
            defaultValue: './gen',
            description: 'Folder to output generated packages to.',
          },
          {
            name: 'exclude',
            multiple: true,
            defaultValue: [],
            description: 'Glob of source files to exclude from analysis.',
          },
        ],
        async run(
          {
            package: packages,
            framework: frameworks,
            manifest,
            out: outDir,
            exclude,
          }: {
            package: string[];
            framework: string[];
            manifest: boolean;
            out: string;
            exclude: string[];
          },
          console: Console
        ) {
          const gen = await import('../generate/generate.js');
          await gen.run(
            {cli, packages, frameworks, manifest, outDir, exclude},
            console
          );
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
};
