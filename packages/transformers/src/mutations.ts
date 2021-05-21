/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import * as ts from 'typescript';

/**
 * Changes that need making to a LitElement class.
 */
export class LitElementMutations {
  /**
   * Remove a node from the AST (e.g. a decorator that is no longer required).
   * Note the node must be a descendant of this specific element class.
   */
  removeNodes = new Set<ts.Node>();

  /**
   * Add a new statement that will be inserted into the AST immediately after
   * this element (e.g. a customElements.define() call).
   */
  adjacentStatements: ts.Node[] = [];
}
