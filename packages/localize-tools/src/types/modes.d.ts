/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

/**
 * Configuration specific to the `runtime` output mode.
 */
export interface RuntimeOutputConfig {
  mode: 'runtime';

  /**
   * Language for emitting generated modules. Options:
   *
   * - "ts": Default. Emit TypeScript modules with ".ts" file extension.
   * - "js": Emit JavaScript modules with ".js" file extension.
   */
  language?: 'ts' | 'js';

  /**
   * Output directory for generated modules. Into this directory will be
   * generated a <locale>.ts for each `targetLocale`, each a module that exports
   * the translations in that locale keyed by message ID.
   */
  outputDir: string;

  /**
   * Optional filepath for a generated module that exports `sourceLocale`,
   * `targetLocales`, and `allLocales` using the locale codes from your config
   * file. Use to keep your config file and client config in sync. For example:
   *
   *   export const sourceLocale = 'en';
   *   export const targetLocales = ['es-419', 'zh_CN'];
   *   export const allLocales = ['es-419', 'zh_CN', 'en'];
   *
   * This path should end with either ".ts" or ".js". If it ends with ".ts" it
   * will be emitted as a TypeScript module. If it ends with ".js" it will be
   * emitted as a JavaScript module.
   */
  localeCodesModule?: string;
}

/**
 * Configuration specific to the `transform` output mode.
 */
export interface TransformOutputConfig {
  mode: 'transform';

  /**
   * Optional filepath for a generated module that exports `sourceLocale`,
   * `targetLocales`, and `allLocales` using the locale codes from your config
   * file. Use to keep your config file and client config in sync. For example:
   *
   *   export const sourceLocale = 'en';
   *   export const targetLocales = ['es-419', 'zh_CN'];
   *   export const allLocales = ['es-419', 'zh_CN', 'en'];
   *
   * This path should end with either ".ts" or ".js". If it ends with ".ts" it
   * will be emitted as a TypeScript module. If it ends with ".js" it will be
   * emitted as a JavaScript module.
   */
  localeCodesModule?: string;
}
