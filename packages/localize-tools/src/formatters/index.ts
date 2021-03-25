/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import type {Config} from '../types/config.js';
import type {Locale} from '../types/locale.js';
import {Message, ProgramMessage, Bundle} from '../messages.js';
import {xlbFactory} from './xlb.js';
import {xliffFactory} from './xliff.js';
import type {FormatConfig} from '../types/formatters.js';

/**
 * The names of our supported formatters (as used by the config file).
 */
type FormatName = FormatConfig['format'];

const factories: {[P in FormatName]: (config: Config) => Formatter} = {
  xliff: xliffFactory,
  xlb: xlbFactory,
};

/**
 * Create a formatter for the given lit-localize config.
 */
export function makeFormatter(config: Config): Formatter {
  return factories[config.interchange.format](config);
}

/**
 * The set of valid formatter names.
 */
export const formats = new Set<FormatName>(
  Object.keys(factories) as FormatName[]
);

/**
 * Implements read/write operations for some localization interchange format.
 */
export abstract class Formatter {
  /**
   * Read translations we have already received.
   */
  abstract readTranslations(): Bundle[];

  /**
   * Write localization interchange data (i.e. translation requests) to disk.
   */
  abstract writeOutput(
    sourceMessages: ProgramMessage[],
    translations: Map<Locale, Message[]>
  ): Promise<void>;
}
