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
import {isLocale, Locale} from './locales';
import {KnownError} from './error';

require('source-map-support').install();

export async function runAndExit() {
  const exitCode = await runAndLog(process.argv);
  process.exit(exitCode);
}

export async function runAndLog(argv: string[]): Promise<number> {
  try {
    await runAndThrow(argv);
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
    console.log(`Args: ${argv.join(' ')}`);
    console.log();
    return 1;
  }
  return 0;
}

function version() {
  return require(path.join('..', 'package.json')).version;
}

async function runAndThrow(argv: string[]) {
  const opts = optsFromArgs(argv);

  // Extract messages from our TypeScript program.
  const program = programFromTsConfig(opts.tsConfig);
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
  const xlb = generateXlb(messages, opts.defaultLocale);
  const xlbFilename = path.join(opts.xlbDir, `${opts.defaultLocale}.xlb`);
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
  const ts = generateMsgModule(messages, opts.locales, opts.defaultLocale);
  const tsFilename = path.join(opts.tsOut, 'localization.ts');
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
  for (const locale of opts.locales.slice(1)) {
    // Parse translated messages out of XLB files.
    const filename = path.join(path.join(opts.xlbDir, `${locale}.xlb`));
    let xmlStr;
    try {
      xmlStr = fs.readFileSync(filename, 'utf8');
    } catch (e) {
      if (e.code === 'ENOENT') {
        throw new KnownError(
          `Expected to find ${locale}.xlb in ${opts.xlbDir} for ${locale} locale`
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
    const ts = generateLocaleModule(bundle, messages);
    fs.writeFileSync(path.join(opts.tsOut, `${locale}.ts`), ts);
  }
}

const usageError = new KnownError(`
Usage: lit-localize
--tsconfig=<path to tsconfig.json>
--locales=en,es-419,...
--xlb-dir=<directory for .xlb files>
--ts-out=<output directory for generated TypeScript files>`);

interface Options {
  tsConfig: string;
  locales: Locale[];
  defaultLocale: Locale;
  xlbDir: string;
  tsOut: string;
}

function optsFromArgs(argv: string[]): Options {
  const args = minimist(argv.slice(2));
  if (args._.length > 0) {
    throw usageError;
  }
  const locales = requiredString(args['locales']).split(',');
  if (locales.length === 0 || locales.some((locale) => !isLocale(locale))) {
    throw usageError;
  }
  return {
    tsConfig: requiredString(args['tsconfig']),
    locales: locales as Locale[],
    defaultLocale: locales[0] as Locale,
    xlbDir: requiredString(args['xlb-dir']),
    tsOut: requiredString(args['ts-out']),
  };
}

function requiredString(arg: unknown): string {
  if (!arg || typeof arg !== 'string') {
    throw usageError;
  }
  return arg;
}
