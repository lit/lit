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
import {generateXlb, parseXlb} from './xlb';
import {ProgramMessage} from './interfaces';
import {KnownError} from './error';
import {Config, readConfigFileAndWriteSchema} from './config';

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
  const program = programFromTsConfig(config.tsConfig);
  const {messages, errors} = extractMessagesFromProgram(program);
  if (errors.length > 0) {
    printDiagnostics(errors);
    throw new KnownError('Error analyzing program');
  }

  // Sort by message description, then filename (for determinism, in case there
  // is no description, since file-process order is arbitrary), then by
  // source-code position order. The order of entries in XLB files is
  // significant, and will determine the order in which messages are displayed
  // to translators. We want messages that are logically related to be presented
  // together.
  messages.sort((a: ProgramMessage, b: ProgramMessage) => {
    const descCompare = a.descStack
      .join('')
      .localeCompare(b.descStack.join(''));
    if (descCompare !== 0) {
      return descCompare;
    }
    return a.file.fileName.localeCompare(b.file.fileName);
  });

  // Write our canonical XLB file. This is the file that gets sent for
  // translation.
  const xlb = generateXlb(messages, config.sourceLocale);
  const xlbFilename = path.join(config.xlbDir, `${config.sourceLocale}.xlb`);
  try {
    fs.writeFileSync(xlbFilename, xlb);
  } catch (e) {
    throw new KnownError(
      `Error writing XLB file: ${xlbFilename}\n` +
        `Does the parent directory exist, ` +
        `and do you have write permission?\n` +
        e.message
    );
  }

  // Write our "localization.ts" TypeScript module. This is the file that
  // implements the "msg" function for our TypeScript program.
  const ts = generateMsgModule(
    messages,
    config.targetLocales,
    config.sourceLocale
  );
  const tsFilename = path.join(config.tsOut, 'localization.ts');
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

  // Handle each translated locale.
  for (const locale of config.targetLocales) {
    // Parse translated messages out of XLB files.
    const filename = path.join(path.join(config.xlbDir, `${locale}.xlb`));
    let xmlStr;
    try {
      xmlStr = fs.readFileSync(filename, 'utf8');
    } catch (e) {
      if (e.code === 'ENOENT') {
        throw new KnownError(
          `Expected to find ${locale}.xlb in ${config.xlbDir} for ${locale} locale`
        );
      } else {
        throw e;
      }
    }
    const bundle = parseXlb(xmlStr);
    if (bundle.locale !== locale) {
      throw new KnownError(
        `Expected ${locale}.xlb to have locale ${locale}, was ${bundle.locale}`
      );
    }

    // For each translated locale, generate a "<locale>.ts" TypeScript module
    // that contains the mapping from message ID to each translated version. The
    // "localization.ts" file we generated earlier knows how to import and
    // switch between these maps.
    const ts = generateLocaleModule(bundle, messages, config.patches || {});
    fs.writeFileSync(path.join(config.tsOut, `${locale}.ts`), ts);
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
