/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

/**
 * Shared options for all fixture functions
 */
export interface FixtureOptions {
  /**
   * Array of relative module paths to be imported before rendering. Normally
   * would contain custom element definitions.
   */
  modules: string[];
  /**
   * Base url for resolving module paths. If not provided, will guess the
   * location based on call stack to have the same effect as passing in
   * `import.meta.url`.
   */
  base?: string;
}

/**
 * Options for SSR fixture functions
 */
export interface SsrFixtureOptions extends FixtureOptions {
  /**
   * Whether to hydrate the SSRed component after adding to the browser
   * document. Defaults to true.
   */
  hydrate?: boolean;
}
