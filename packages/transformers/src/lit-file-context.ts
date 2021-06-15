/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import * as ts from 'typescript';

export class LitFileContext {
  readonly imports = new Map<ts.Node, string>();
  readonly removeNodes = new Set<ts.Node>();

  private readonly _program: ts.Program;

  constructor(program: ts.Program) {
    this._program = program;
  }

  /**
   * If the given node refers to a symbol imported from a Lit package, return
   * Lit's canonical name for that symbol.
   */
  getCanonicalName(node: ts.Node): string | undefined {
    const symbol = this._program.getTypeChecker().getSymbolAtLocation(node);
    const firstDeclaration = symbol?.declarations[0];
    if (firstDeclaration === undefined) {
      return undefined;
    }
    return this.imports.get(firstDeclaration);
  }
}
