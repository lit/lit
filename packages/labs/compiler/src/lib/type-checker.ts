/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import ts from 'typescript';

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
    if (ts.isIdentifier(node.tag)) {
      return this.isResolvedIdentifierLitHtmlTemplate(node.tag);
    }
    if (ts.isPropertyAccessExpression(node.tag)) {
      return this.isResolvedPropertyAccessExpressionLitHtmlNamespace(node.tag);
    }
    return false;
  }

  /**
   * Resolve the tag function identifier back to an import, returning true if
   * the original reference was the `html` export from `lit` or `lit-html`.
   *
   * This check handles: aliasing and reassigning the import.
   *
   * ```ts
   * import {html as h} from 'lit';
   * h``;
   * // isResolvedIdentifierLitHtmlTemplate(<h ast node>) returns true
   * ```
   *
   * ```ts
   * import {html} from 'lit-html/static.js';
   * html`false`;
   * // isResolvedIdentifierLitHtmlTemplate(<html ast node>) returns false
   * ```
   *
   * @param node a TaggedTemplateExpression tag
   */
  private isResolvedIdentifierLitHtmlTemplate(node: ts.Identifier): boolean {
    const checker = this.checker;

    const symbol = checker.getSymbolAtLocation(node);
    if (!symbol) {
      return false;
    }
    const templateImport = symbol.declarations?.[0];
    if (!templateImport || !ts.isImportSpecifier(templateImport)) {
      return false;
    }

    // An import specifier has the following structures:
    //
    // `import {<propertyName> as <name>} from <moduleSpecifier>;`
    // `import {<name>} from <moduleSpecifier>;`
    //
    // This check allows aliasing `html` by ensuring propertyName is `html`.
    // Thus `{html as myHtml}` is a valid template that can be compiled.
    // Otherwise a compilable template must be a direct import of lit's `html`
    // tag function.
    if (
      (templateImport.propertyName &&
        templateImport.propertyName.text !== 'html') ||
      (!templateImport.propertyName && templateImport.name.text !== 'html')
    ) {
      return false;
    }
    const namedImport = templateImport.parent;
    if (!ts.isNamedImports(namedImport)) {
      return false;
    }
    const importClause = namedImport.parent;
    if (!ts.isImportClause(importClause)) {
      return false;
    }
    const importDeclaration = importClause.parent;
    if (!ts.isImportDeclaration(importDeclaration)) {
      return false;
    }
    const specifier = importDeclaration.moduleSpecifier;
    if (!ts.isStringLiteral(specifier)) {
      return false;
    }
    return this.isLitTemplateModuleSpecifier(specifier.text);
  }

  /**
   * Resolve a common pattern of using the `html` identifier of a lit namespace
   * import.
   *
   * E.g.:
   *
   * ```ts
   * import * as identifier from 'lit';
   * identifier.html`<p>I am compiled!</p>`;
   * ```
   */
  private isResolvedPropertyAccessExpressionLitHtmlNamespace(
    node: ts.PropertyAccessExpression
  ): boolean {
    // Ensure propertyAccessExpression ends with `.html`.
    if (ts.isIdentifier(node.name) && node.name.text !== 'html') {
      return false;
    }
    // Expect a namespace preceding `html`, `<namespace>.html`.
    if (!ts.isIdentifier(node.expression)) {
      return false;
    }

    // Resolve the namespace if it has been aliased.
    const checker = this.checker;
    const symbol = checker.getSymbolAtLocation(node.expression);
    if (!symbol) {
      return false;
    }
    const namespaceImport = symbol.declarations?.[0];
    if (!namespaceImport || !ts.isNamespaceImport(namespaceImport)) {
      return false;
    }
    const importDeclaration = namespaceImport.parent.parent;
    const specifier = importDeclaration.moduleSpecifier;
    if (!ts.isStringLiteral(specifier)) {
      return false;
    }
    return this.isLitTemplateModuleSpecifier(specifier.text);
  }

  private isLitTemplateModuleSpecifier(specifier: string): boolean {
    return (
      specifier === 'lit' ||
      specifier === 'lit-html' ||
      specifier === 'lit-element'
    );
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
