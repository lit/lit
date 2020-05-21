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
import * as pathLib from 'path';
import {Locale} from './locales';
import {KnownError} from './error';
import {FormatConfig} from './formatters';

interface ConfigFile {
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
   * @items.type string
   */
  targetLocales: Locale[];

  /**
   * Path to a tsconfig.json file that describes the TypeScript source files
   * from which messages will be extracted.
   */
  tsConfig: string;

  /**
   * Localization interchange format and configuration specific to that format.
   */
  interchange: FormatConfig;

  /**
   * Set and configure the output mode.
   */
  output: RuntimeOutputConfig;

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
 * Configuration specific to the `runtime` output mode.
 */
export interface RuntimeOutputConfig {
  mode: 'runtime';

  /**
   * Output directory for generated TypeScript modules. After running
   * lit-localize, this directory will contain:
   *
   * 1. localization.ts -- A TypeScript module that exports the `msg` function,
   *    along with other utilities.
   *
   * 2. <locale>.ts -- For each `targetLocale`, a TypeScript module that exports
   *    the translations in that locale keyed by message ID. These modules are
   *    used automatically by localization.ts and should not typically be
   *    imported directly by user code.
   */
  outputDir: string;

  /**
   * The initial locale, if no other explicit locale selection has been made.
   * Defaults to the value of `sourceLocale`.
   *
   * @TJS-type string
   */
  defaultLocale?: Locale;

  /**
   * If true, export a `setLocale(locale: Locale)` function in the generated
   * `<outputDir>/localization.ts` module. Defaults to false.
   *
   * Note that calling this function will set the locale for subsequent calls to
   * `msg`, but will not automatically re-render existing templates.
   */
  exportSetLocaleFunction?: boolean;

  /**
   * Automatically set the locale based on the URL at application startup.
   */
  setLocaleFromUrl?: {
    /**
     * Set locale based on matching a regular expression against the URL.
     *
     * The regexp will be matched against `window.location.href`, and the first
     * capturing group will be used as the locale. If no match is found, or if
     * the capturing group does not contain a valid locale code, then
     * `defaultLocale` is used.
     *
     * Optionally use the special string `:LOCALE:` to substitute a capturing
     * group into the regexp that will only match the currently configured
     * locale codes (`sourceLocale` and `targetLocales`). For example, if
     * sourceLocale=en and targetLocales=es,zh_CN, then the regexp
     * "^https?://:LOCALE:\\." becomes "^https?://(en|es|zh_CN)\\.".
     *
     * Tips: Remember to double-escape literal backslashes (once for JSON, once
     * for the regexp), and note that you can use `(?:foo)` to create a
     * non-capturing group.
     *
     * It is an error to set both `regexp` and `param`.
     *
     * Examples:
     *
     * 1. "^https?://[^/]+/:LOCALE:(?:$|[/?#])"
     *
     *     Set locale from the first path component.
     *
     *     E.g. https://www.example.com/es/foo
     *                                  ^^
     *
     * 2. "^https?://:LOCALE:\\."
     *
     *     Set locale from the first subdomain.
     *
     *     E.g. https://es.example.com/foo
     *                  ^^
     */
    regexp?: string;

    /**
     * Set locale based on the value of a URL query parameter.
     *
     * Finds the first matching query parameter from `window.location.search`.
     * If no such URL query parameter is set, or if it is not a valid locale
     * code, then `defaultLocale` is used.
     *
     * It is an error to set both `regexp` and `param`.
     *
     * Examples:
     *
     * 1. "lang"
     *
     *     https://example.com?foo&lang=es&bar
     *                                  ^^
     */
    param?: string;
  };
}

/**
 * A validated config file, plus any extra properties not present in the file
 * itself.
 */
export interface Config extends ConfigFile {
  /**
   * Base directory on disk that contained the config file. Used for resolving
   * paths relative to the config file.
   */
  baseDir: string;

  /**
   * Resolve a filepath relative to the directory that contained the config
   * file.
   */
  resolve: (path: string) => string;
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
 * Read a JSON config file from the given path, validate it, and return it. Also
 * adds a "$schema" property if missing. Throws if there was a problem reading,
 * parsing, or validating.
 */
export function readConfigFileAndWriteSchema(configPath: string): Config {
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

  const validated = parsed as ConfigFile;
  const output = validated.output;
  if (output.mode === 'runtime' && output.setLocaleFromUrl) {
    if (!!output.setLocaleFromUrl.param === !!output.setLocaleFromUrl.regexp) {
      throw new KnownError(
        `Error validating config file ${configPath}:\n\n` +
          `If output.setLocaleFromUrl is set, then either param or regexp ` +
          `must be set, but not both.`
      );
    }
  }

  writeConfigSchemaIfMissing(validated, configPath);

  const baseDir = pathLib.dirname(configPath);
  const config = {
    ...validated,
    baseDir,
    resolve: (path: string) => pathLib.resolve(baseDir, path),
  };

  return config;
}

/**
 * Unless already present, add a "$schema" property to the given config object
 * with the lit-localize schema descriptor on GitHub and write it back to disk.
 *
 * This $schema property allows editors like VSCode to provide validation and
 * auto-completion for the config format.
 */
function writeConfigSchemaIfMissing(config: ConfigFile, configPath: string) {
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
