import type ts from 'typescript';

type TypeScript = typeof ts;

/**
 * Returns true if this node is an import declaration for a module known to
 * export the Lit html template tag.
 */
export const isLitHtmlImportDeclaration = (
  node: ts.Node,
  ts: TypeScript
): node is ts.ImportDeclaration => {
  if (!ts.isImportDeclaration(node)) {
    return false;
  }
  const specifier = node.moduleSpecifier;
  if (!ts.isStringLiteral(specifier)) {
    return false;
  }
  return isKnownLitHtmlModuleSpecifier(specifier.text);
};

/**
 * Returns true if the specifier is known to export the Lit html template tag.
 *
 * This can be used in a heuristic to determine if a template is a lit-html
 * template.
 */
export const isKnownLitHtmlModuleSpecifier = (specifier: string): boolean => {
  return (
    specifier === 'lit' ||
    specifier === 'lit-html' ||
    specifier === 'lit-element'
  );
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
export const isResolvedPropertyAccessExpressionLitHtmlNamespace = (
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
  return isKnownLitHtmlModuleSpecifier(specifier.text);
};
