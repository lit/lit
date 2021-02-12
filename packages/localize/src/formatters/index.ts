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

import {Config} from '../config';
import {Locale} from '../locales';
import {Message, ProgramMessage, Bundle} from '../messages';
import {XlbConfig, xlbFactory} from './xlb';
import {XliffConfig, xliffFactory} from './xliff';

/**
 * Union of configuration objects for each of the supported interchange
 * formatters.
 */
export type FormatConfig = XlbConfig | XliffConfig;

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
  abstract readTranslations(): Promise<Bundle[]>;

  /**
   * Write localization interchange data (i.e. translation requests) to disk.
   */
  abstract writeOutput(
    sourceMessages: ProgramMessage[],
    translations: Map<Locale, Message[]>
  ): Promise<void>;
}
