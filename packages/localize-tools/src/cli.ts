/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import * as path from 'path';
import minimist from 'minimist';
import {KnownError, unreachable} from './error.js';
import type {Config} from './types/config.js';
import {readConfigFileAndWriteSchema} from './config.js';
import {LitLocalizer} from './index.js';
import {printDiagnostics} from './typescript.js';
import {TransformLitLocalizer} from './modes/transform.js';
import {RuntimeLitLocalizer} from './modes/runtime.js';
import type {
  TransformOutputConfig,
  RuntimeOutputConfig,
} from './types/modes.js';
import {dirname} from 'path';
import {fileURLToPath} from 'url';
import * as fs from 'fs/promises';
import 'source-map-support/register.js';

const usage = `
Usage: lit-localize [--config=lit-localize.json] COMMAND

Commands:
  extract     Extract messages from source files
  build       Build your project

Options:
  --help      Display this help message.
  --config    Path to JSON configuration file.
              Default: ./lit-localize.json
              See https://github.com/lit/lit/tree/main/packages/localize#readme for details.
`;

const commands = ['build', 'extract'] as const;
type Command = (typeof commands)[number];
const isCommand = (str: string): str is Command =>
  commands.includes(str as Command);

interface CliOptions {
  config: Config;
  command: Command;
}

export async function runAndExit() {
  const exitCode = await runAndLog(process.argv);
  process.exit(exitCode);
}

export async function runAndLog(argv: string[]): Promise<number> {
  let config;
  try {
    const cliOpts = cliOptsFromArgs(argv);
    config = cliOpts.config;
    await runAndThrow(cliOpts);
  } catch (err) {
    if (err instanceof KnownError) {
      console.error(err.message);
    } else {
      console.error('Unexpected error\n');
      console.error((err as Error).message);
      console.error();
      console.error((err as Error).stack);
    }
    console.log();
    console.log(`Version: ${await version()}`);
    console.log(`Args: ${argv.slice(2).join(' ')}`);
    if (config) {
      console.log(`Config:`, JSON.stringify(config, null, 2));
    }
    console.log();
    return 1;
  }
  return 0;
}

async function version() {
  const packageJsonPath = path.resolve(
    dirname(fileURLToPath(import.meta.url)),
    '..',
    'package.json'
  );
  const packageJson = JSON.parse(
    await fs.readFile(packageJsonPath, 'utf8')
  ) as {version: number};
  return packageJson.version;
}

async function runAndThrow({config, command}: CliOptions) {
  const localizer = makeLocalizer(config);

  if (command === 'extract') {
    // TODO(aomarks) Don't even require the user to have configured their output
    // mode if they're just doing extraction.
    console.log('Extracting messages');
    const {messages, errors} = localizer.extractSourceMessages();
    if (errors.length > 0) {
      printDiagnostics(errors);
      throw new KnownError('Error analyzing program');
    }
    console.log(`Extracted ${messages.length} messages`);
    console.log(`Writing interchange files`);
    await localizer.writeInterchangeFiles();
  } else if (command === 'build') {
    console.log('Building');
    const {errors} = localizer.validateTranslations();
    if (errors.length > 0) {
      // TODO(aomarks) It might be more friendly to replace these invalid
      // localized templates with the source ones, show the errors and return
      // non-zero, but still continue with the rest of the process so that at
      // least some of the app can work during development.
      throw new KnownError(
        'One or more localized templates contain a set of placeholders ' +
          '(HTML or template literal expressions) that do not exactly match ' +
          'the source code, aborting. Details:\n\n' +
          errors.join('\n')
      );
    }
    await localizer.build();
  } else {
    // Should already have been validated.
    throw new KnownError(
      `Internal error: unknown command ${unreachable(command)}`
    );
  }
}

function makeLocalizer(config: Config): LitLocalizer {
  switch (config.output.mode) {
    case 'transform':
      return new TransformLitLocalizer(
        // TODO(aomarks) Unfortunate that TypeScript doesn't automatically do
        // this type narrowing. Because the union is on a nested property?
        config as Config & {output: TransformOutputConfig}
      );
    case 'runtime':
      return new RuntimeLitLocalizer(
        config as Config & {output: RuntimeOutputConfig}
      );
    default:
      throw new KnownError(
        `Internal error: unknown mode ${
          (unreachable(config.output) as Config['output']).mode
        }`
      );
  }
}

function cliOptsFromArgs(argv: string[]): CliOptions {
  const args = minimist(argv.slice(2));
  if (args._.length === 0) {
    throw new KnownError(
      `Missing command argument. ` +
        `Valid commands: ${[...commands].join(', ')}`
    );
  }
  const command = args._[0];
  if (!isCommand(command)) {
    throw new KnownError(
      `Invalid command ${command}}. ` +
        `Valid commands: ${[...commands].join(', ')}`
    );
  }
  if (args._.length > 1) {
    throw new KnownError(
      `Unknown argument(s): ${args._.slice(1).join(' ')}` + usage
    );
  }
  if ('help' in args) {
    throw new KnownError(usage);
  }
  const configPath = args['config'] || './lit-localize.json';
  const config = readConfigFileAndWriteSchema(configPath);
  return {config, command};
}
