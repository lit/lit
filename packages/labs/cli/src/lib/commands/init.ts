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
  out: string;
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
            description:
              'Tag name of the Element to generate (must include a hyphen).',
          },
          {
            name: 'out',
            defaultValue: '.',
            description: 'Directory in which to generate the element package.',
          },
        ],
        async run(options: CommandOptions, console: Console) {
          const name = options.name as string;
          /*
           * This is a basic check to ensure that the name is a valid custom
           * element name. Will make sure you you start off with a character and
           * at least one hyphen plus more characters. Will not check for the
           * following invalid use cases:
           *   - starting with a digit
           *
           * Will not allow the following valid use cases:
           *   - including a unicode character as not the first character
           */
          const customElementMatch = name.match(/\w+(-\w+)+/g);
          if (!customElementMatch || customElementMatch[0] !== name) {
            throw new Error(
              `"${name}" is not a valid custom-element name. (Must include a hyphen and ascii characters)`
            );
          }
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
      return await run(
        {lang: 'js', name: 'my-element', out: '.'},
        console,
        cli
      );
    },
  };
};
