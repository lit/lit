/**
 * @license
 * Copyright (c) 2020 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt The complete set of authors may be found
 * at http://polymer.github.io/AUTHORS.txt The complete set of contributors may
 * be found at http://polymer.github.io/CONTRIBUTORS.txt Code distributed by
 * Google as part of the polymer project is also subject to an additional IP
 * rights grant found at http://polymer.github.io/PATENTS.txt
 */

import * as path from 'path';
import * as minimist from 'minimist';

import {programFromTsConfig, printDiagnostics} from './typescript';
import {extractMessagesFromProgram} from './program-analysis';
import {runtimeOutput} from './outputters/runtime';
import {transformOutput} from './outputters/transform';
import {makeFormatter} from './formatters';
import {
  ProgramMessage,
  Message,
  validateLocalizedPlaceholders,
} from './messages';
import {KnownError, throwUnreachable} from './error';
import {Config, readConfigFileAndWriteSchema} from './config';
import {Locale} from './locales';

// eslint-disable-next-line @typescript-eslint/no-var-requires
require('source-map-support').install();

export async function runAndExit() {
  const exitCode = await runAndLog(process.argv);
  process.exit(exitCode);
}

export async function runAndLog(argv: string[]): Promise<number> {
  let config;
  try {
    config = configFromArgs(argv);
    await runAndThrow(config);
  } catch (err) {
    if (err instanceof KnownError) {
      console.error(err.message);
    } else {
      console.error('Unexpected error\n');
      console.error(err.message);
      console.error();
      console.error(err.stack);
    }
    console.log();
    console.log(`Version: ${version()}`);
    console.log(`Args: ${argv.slice(2).join(' ')}`);
    if (config) {
      console.log(`Config:`, JSON.stringify(config, null, 2));
    }
    console.log();
    return 1;
  }
  return 0;
}

function version() {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  return require(path.join('..', 'package.json')).version;
}

async function runAndThrow(config: Config) {
  // Extract messages from our TypeScript program.
  const program = programFromTsConfig(config.resolve(config.tsConfig));
  const {messages, errors} = extractMessagesFromProgram(program);
  if (errors.length > 0) {
    printDiagnostics(errors);
    throw new KnownError('Error analyzing program');
  }

  // Sort by message description, then filename (for determinism, in case there
  // is no description, since file-process order is arbitrary), then by
  // source-code position order. The order of entries in interchange files can
  // be significant, e.g. in determining the order in which messages are
  // displayed to translators. We want messages that are logically related to be
  // presented together.
  messages.sort((a: ProgramMessage, b: ProgramMessage) => {
    const descCompare = a.descStack
      .join('')
      .localeCompare(b.descStack.join(''));
    if (descCompare !== 0) {
      return descCompare;
    }
    return a.file.fileName.localeCompare(b.file.fileName);
  });

  // Read existing translations, and write translation interchange data
  // according to the formatter that is configured.
  const formatter = makeFormatter(config);
  const translationMap = new Map<Locale, Message[]>();
  for (const bundle of await formatter.readTranslations()) {
    translationMap.set(bundle.locale, bundle.messages);
  }
  const placeholderErrors = validateLocalizedPlaceholders(
    messages,
    translationMap
  );
  if (placeholderErrors.length > 0) {
    // TODO(aomarks) It might be more friendly to replace these invalid
    // localized templates with the source ones, show the errors and return
    // non-zero, but still continue with the rest of the process so that at
    // least some of the app can work during development.

    // TODO(aomarks) It would also be nice to track the filename and line
    // numbers for each localized template as they appeared in the interchange
    // (e.g. XLIFF) file, so that users can debug more easily.
    throw new KnownError(
      'One or more localized templates contain a set of placeholders ' +
        '(HTML or template literal expressions) that do not exactly match ' +
        'the source code, aborting. Details:\n\n' +
        placeholderErrors.join('\n')
    );
  }
  await formatter.writeOutput(messages, translationMap);

  if (config.output.mode === 'runtime') {
    await runtimeOutput(messages, translationMap, config, config.output);
  } else if (config.output.mode === 'transform') {
    await transformOutput(translationMap, config, config.output, program);
  } else {
    throwUnreachable(
      config.output,
      `Internal error: unknown output mode ${
        (config.output as typeof config.output).mode
      }`
    );
  }
}

const usage = `
Usage: lit-localize [--config=lit-localize.json]

Options:
  --help      Display this help message.
  --config    Path to JSON configuration file.
              Default: ./lit-localize.json
              See https://github.com/PolymerLabs/lit-localize for details.
`;

function configFromArgs(argv: string[]): Config {
  const args = minimist(argv.slice(2));
  if (args._.length > 0) {
    throw new KnownError(`Unknown argument(s): ${args._.join(' ')}` + usage);
  }
  if ('help' in args) {
    throw new KnownError(usage);
  }
  const configPath = args['config'] || './lit-localize.json';
  const config = readConfigFileAndWriteSchema(configPath);
  return config;
}
