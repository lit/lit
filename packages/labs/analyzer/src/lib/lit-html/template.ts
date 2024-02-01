/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

/**
 * @fileoverview
 *
 * Utilities for analyzing lit-html templates.
 */

import type ts from 'typescript';

type TypeScript = typeof ts;

/**
 * Returns true if the specifier is know to export the Lit html template tag.
 *
 * This can be used in a hueristic to determine if a template is a lit-html
 * template.
 */
export const isKnownLitModuleSpecifier = (specifier: string): boolean => {
  return (
    specifier === 'lit' ||
    specifier === 'lit-html' ||
    specifier === 'lit-element'
  );
};

/**
 * Returns true if the given node is a tagged template expression with the
 * lit-html template tag.
 */
export const isLitTaggedTemplateExpression = (
  node: ts.Node,
  ts: TypeScript,
  checker: ts.TypeChecker
): node is ts.TaggedTemplateExpression => {
  if (!ts.isTaggedTemplateExpression(node)) {
    return false;
  }
  if (ts.isIdentifier(node.tag)) {
    return isResolvedIdentifierLitHtmlTemplate(node.tag, ts, checker);
  }
  if (ts.isPropertyAccessExpression(node.tag)) {
    return isResolvedPropertyAccessExpressionLitHtmlNamespace(
      node.tag,
      ts,
      checker
    );
  }
  return false;
};

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
const isResolvedPropertyAccessExpressionLitHtmlNamespace = (
  node: ts.PropertyAccessExpression,
  ts: TypeScript,
  checker: ts.TypeChecker
): boolean => {
  // Ensure propertyAccessExpression ends with `.html`.
  if (ts.isIdentifier(node.name) && node.name.text !== 'html') {
    return false;
  }
  // Expect a namespace preceding `html`, `<namespace>.html`.
  if (!ts.isIdentifier(node.expression)) {
    return false;
  }

  // Resolve the namespace if it has been aliased.
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
  return isKnownLitModuleSpecifier(specifier.text);
};

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
const isResolvedIdentifierLitHtmlTemplate = (
  node: ts.Identifier,
  ts: TypeScript,
  checker: ts.TypeChecker
): boolean => {
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
  return isKnownLitModuleSpecifier(specifier.text);
};
