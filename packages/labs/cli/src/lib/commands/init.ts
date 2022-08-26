/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {Command, CommandOptions} from '../command.js';
import {run} from '../init/element-starter/index.js';
import {LitCli} from '../lit-cli.js';

export type Language = 'ts' | 'js';
export interface InitCommandOptions {
  lang: Language;
  name: string;
}

export const makeInitCommand = (cli: LitCli): Command => {
  return {
    kind: 'resolved',
    name: 'init',
    description: 'Initialize a Lit project',
    subcommands: [
      {
        kind: 'resolved',
        name: 'element',
        description: 'Generate a shareable element starter package',
        options: [
          {
            name: 'lang',
            defaultValue: 'js',
            description:
              'Which language to use for the element. Supported languages: js, ts',
          },
          {
            name: 'name',
            defaultValue: 'my-element',
            description: 'Name of the Element to generate.',
          },
        ],
        async run(options: CommandOptions, console: Console) {
          return await run(
            options as unknown as InitCommandOptions,
            console,
            cli
          );
        },
      },
    ],
    async run(_options: CommandOptions, console: Console) {
      // by default run the element command
      return await run({lang: 'js', name: 'my-element'}, console, cli);
    },
  };
};
