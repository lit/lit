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
import * as fs from 'fs';
import * as minimist from 'minimist';

import {programFromTsConfig, printDiagnostics} from './typescript';
import {extractMessagesFromProgram} from './program-analysis';
import {generateMsgModule, generateLocaleModule} from './module-generation';
import {makeFormatter} from './formatters';
import {ProgramMessage, Message} from './messages';
import {KnownError} from './error';
import {Config, readConfigFileAndWriteSchema} from './config';
import {Locale} from './locales';

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
  await formatter.writeOutput(messages, translationMap);

  // Write our "localization.ts" TypeScript module. This is the file that
  // implements the "msg" function for our TypeScript program.
  const ts = generateMsgModule(
    messages,
    config.targetLocales,
    config.sourceLocale
  );
  const tsFilename = path.join(config.resolve(config.tsOut), 'localization.ts');
  try {
    fs.writeFileSync(tsFilename, ts);
  } catch (e) {
    throw new KnownError(
      `Error writing TypeScript file: ${tsFilename}\n` +
        `Does the parent directory exist, ` +
        `and do you have write permission?\n` +
        e.message
    );
  }

  // For each translated locale, generate a "<locale>.ts" TypeScript module that
  // contains the mapping from message ID to each translated version. The
  // "localization.ts" file we generated earlier knows how to import and switch
  // between these maps.
  for (const locale of config.targetLocales) {
    const translations = translationMap.get(locale) || [];
    const ts = generateLocaleModule(
      locale,
      translations,
      messages,
      config.patches || {}
    );
    fs.writeFileSync(
      path.join(config.resolve(config.tsOut), `${locale}.ts`),
      ts
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
