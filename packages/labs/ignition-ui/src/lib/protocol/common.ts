/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

/**
 * A URL on a project server that points to a source file (which might be
 * a TS file that needs to be source mapped to its JS equivalent to find the
 * actual runtime file).
 */
export type ProjectServerSourceUrl = string & {
  __brandProjectServerSourceUrl: never;
};

/**
 * A reference to piece of a template declared in a specific source file.
 *
 * This is constructed from an AST and used to look up nodes at runtime in the
 * DOM.
 */
export interface TemplatePiece {
  kind: 'element';
  url: ProjectServerSourceUrl;
  sourceId: string;
}
