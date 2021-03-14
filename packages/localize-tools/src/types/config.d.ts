/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {FormatConfig} from './formatters.js';
import {RuntimeOutputConfig, TransformOutputConfig} from './modes.js';
import {Locale} from './locale';

export interface ConfigFile {
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
  output: RuntimeOutputConfig | TransformOutputConfig;

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
