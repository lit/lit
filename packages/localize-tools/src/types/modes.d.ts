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
   * Output directory for generated TypeScript modules. Into this directory will
   * be generated a <locale>.ts for each `targetLocale`, each a TypeScript
   * module that exports the translations in that locale keyed by message ID.
   */
  outputDir: string;

  /**
   * Optional filepath for a generated TypeScript module that exports
   * `sourceLocale`, `targetLocales`, and `allLocales` using the locale codes
   * from your config file. Use to keep your config file and client config in
   * sync. For example:
   *
   *   export const sourceLocale = 'en';
   *   export const targetLocales = ['es-419', 'zh_CN'] as const;
   *   export const allLocales = ['es-419', 'zh_CN', 'en'] as const;
   */
  localeCodesModule?: string;
}

/**
 * Configuration specific to the `transform` output mode.
 */
export interface TransformOutputConfig {
  mode: 'transform';

  /**
   * Optional filepath for a generated TypeScript module that exports
   * `sourceLocale`, `targetLocales`, and `allLocales` using the locale codes
   * from your config file. Use to keep your config file and client config in
   * sync. For example:
   *
   *   export const sourceLocale = 'en';
   *   export const targetLocales = ['es-419', 'zh_CN'] as const;
   *   export const allLocales = ['es-419', 'zh_CN', 'en'] as const;
   */
  localeCodesModule?: string;
}
