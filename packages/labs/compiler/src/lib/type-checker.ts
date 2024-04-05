/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import ts from 'typescript';
import {isLitTaggedTemplateExpression} from '@lit-labs/analyzer/lib/lit-html/template.js';

const compilerOptions = {
  target: ts.ScriptTarget.ESNext,
  module: ts.ModuleKind.ESNext,
  skipDefaultLibCheck: true,
  skipLibCheck: true,
  moduleResolution: ts.ModuleResolutionKind.NodeNext,
};

export const getTypeChecker = (filename: string, source: string) => {
  const languageServiceHost = new SingleFileLanguageServiceHost(
    filename,
    source
  );
  const languageService = ts.createLanguageService(
    languageServiceHost,
    ts.createDocumentRegistry()
  );

  const program = languageService.getProgram();
  if (!program) {
    throw new Error(`Internal Error: Could not start TypeScript program`);
  }
  return new TypeChecker(program.getTypeChecker());
};

/**
 * Wrap ts.TypeChecker so we can provide a consistent and scoped API for the
 * compiler.
 */
class TypeChecker {
  private checker: ts.TypeChecker;
  constructor(typeChecker: ts.TypeChecker) {
    this.checker = typeChecker;
  }

  /**
   * Use this method to find out if the passed in tagged template expression a
   * compilable `lit` html template.
   *
   * The logic is strict, only marking a template compilable if it is
   *
   * @param node tagged template expression
   * @returns if the tagged template expression is a lit template that can be
   * compiled.
   */
  isLitTaggedTemplateExpression(node: ts.TaggedTemplateExpression): boolean {
    return isLitTaggedTemplateExpression(node, ts, this.checker);
  }
}

/**
 * A simple LanguageServiceHost used for simple, single file, one-time
 * transforms.
 */
class SingleFileLanguageServiceHost implements ts.LanguageServiceHost {
  private compilerOptions: ts.CompilerOptions = compilerOptions;

  private filename: string;
  private source: string;

  constructor(filename: string, source: string) {
    this.filename = filename;
    this.source = source;
  }

  getCompilationSettings(): ts.CompilerOptions {
    return this.compilerOptions;
  }
  getScriptFileNames(): string[] {
    return [this.filename];
  }
  getScriptVersion(_: string): string {
    return '-1';
  }
  getScriptSnapshot(filename: string): ts.IScriptSnapshot | undefined {
    const contents = this.readFile(filename);
    if (contents === undefined) {
      return undefined;
    }
    return ts.ScriptSnapshot.fromString(contents);
  }
  getCurrentDirectory(): string {
    return '.';
  }
  getDefaultLibFileName(options: ts.CompilerOptions): string {
    return ts.getDefaultLibFilePath(options);
  }
  readFile(filename: string): string | undefined {
    if (!this.fileExists(filename)) {
      return undefined;
    }
    return this.source;
  }
  fileExists(filename: string): boolean {
    return this.filename === filename;
  }
}
