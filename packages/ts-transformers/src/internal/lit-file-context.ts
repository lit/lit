/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import ts from 'typescript';

/**
 * State scoped to one module that contains Lit code.
 */
export class LitFileContext {
  /**
   * Maps from a Lit module ImportSpecifier to the canonical name within the Lit
   * packages for that export.
   */
  readonly litImports = new Map<ts.ImportSpecifier, string>();

  /**
   * Nodes that are to be replaced with another node (or removed when undefined)
   * when they are encountered in subsequent traversal.
   */
  readonly nodeReplacements = new Map<ts.Node, ts.Node | undefined>();

  private readonly _program: ts.Program;

  constructor(program: ts.Program) {
    this._program = program;
  }

  clear() {
    this.litImports.clear();
    this.nodeReplacements.clear();
  }

  /**
   * If the given node refers to a symbol imported from a Lit package, return
   * Lit's canonical name for that symbol.
   */
  getCanonicalName(node: ts.Node): string | undefined {
    const symbol = this._program.getTypeChecker().getSymbolAtLocation(node);
    const firstDeclaration = symbol?.declarations?.[0];
    if (
      firstDeclaration === undefined ||
      !ts.isImportSpecifier(firstDeclaration)
    ) {
      return undefined;
    }
    return this.litImports.get(firstDeclaration);
  }

  /**
   * Replace one AST node with another, copying over all associated comments.
   */
  replaceAndMoveComments(oldNode: ts.Node, newNode: ts.Node): void {
    this.nodeReplacements.set(oldNode, newNode);
    // Original source comments.
    ts.setTextRange(newNode, oldNode);
    ts.moveSyntheticComments(newNode, oldNode);
  }
}
