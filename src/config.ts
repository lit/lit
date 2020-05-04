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

import * as fs from 'fs';
import * as jsonSchema from 'jsonschema';
import {Locale} from './locales';
import {KnownError} from './error';

export interface Config {
  /**
   * See https://json-schema.org/understanding-json-schema/reference/schema.html
   */
  $schema?: string;

  /**
   * Required locale code that messages in the source code are written in.
   * @TJS-type string
   */
  sourceLocale: Locale;

  /**
   * Required locale codes that messages will be localized to.
   * @TJS-type string[]
   */
  targetLocales: Locale[];

  /**
   * Path to a tsconfig.json file that describes the TypeScript source files
   * from which messages will be extracted.
   */
  tsConfig: string;

  /**
   * Required path to the directory where generated XLB files will be written.
   */
  xlbDir: string;

  /**
   * Required path to the directory where generated TypeScript files will be
   * written.
   */
  tsOut: string;

  /**
   * Optional string substitutions to apply to specific locale messages. Useful
   * for making minor corrections without modifying source files or repeating a
   * full localization cycle.
   *
   * Example:
   *
   * "patches": {
   *   "es-419": {
   *     "greeting": [
   *       {
   *         "before": "Buenos dias",
   *         "after": "Buenos días"
   *       }
   *     ]
   *   }
   * }
   */
  patches?: {[locale: string]: {[messageId: string]: Patch[]}};
}

/**
 * Replace one string with another.
 */
export interface Patch {
  /** The string to search for. */
  before: string;
  /** The string to replace matches with. */
  after: string;
}

/**
 * Read a JSON config file from the given path, validate it, and return it.
 * Throws if there was a problem reading, parsing, or validating.
 */
export function readConfigFile(configPath: string): Config {
  let str;
  try {
    str = fs.readFileSync(configPath, 'utf8');
  } catch (e) {
    throw new KnownError(
      `Could not read config file from ${configPath}:\n${e.message}`
    );
  }

  let parsed;
  try {
    parsed = JSON.parse(str);
  } catch (e) {
    throw new KnownError(
      `Invalid JSON found in config file ${configPath}:\n${e.message}`
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const schema = require('../config.schema.json');
  const result = jsonSchema.validate(parsed, schema, {propertyName: 'config'});
  if (result.errors.length > 0) {
    throw new KnownError(
      `Error validating config file ${configPath}:\n\n` +
        result.errors.map((error) => String(error)).join('\n')
    );
  }

  return parsed as Config;
}

/**
 * Unless already present, add a "$schema" property to the given config object
 * with the lit-localize schema descriptor on GitHub and write it back to disk.
 *
 * This $schema property allows editors like VSCode to provide validation and
 * auto-completion for the config format.
 */
export function writeConfigSchemaIfMissing(config: Config, configPath: string) {
  if ('$schema' in config) {
    return;
  }
  const withSchema = {
    $schema:
      'https://raw.githubusercontent.com/PolymerLabs/lit-localize/master/config.schema.json',
    ...config,
  };
  const json = JSON.stringify(withSchema, null, 2);
  fs.writeFileSync(configPath, json + '\n', {encoding: 'utf-8'});
}
