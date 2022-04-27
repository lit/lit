/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

/**
 * @fileoverview
 *
 * Utilities for working with LitElement (and ReactiveElement) declarations.
 */

import ts from 'typescript';

/**
 * Returns true if this type represents the actual LitElement class.
 */
const _isLitElementClassDeclaration = (t: ts.BaseType) => {
  // TODO: should we memoize this for performance?
  const declarations = t.getSymbol()?.getDeclarations();
  if (declarations?.length !== 1) {
    return false;
  }
  const node = declarations[0];
  return (
    _isLitElementModule(node.getSourceFile()) &&
    ts.isClassDeclaration(node) &&
    node.name?.getText() === 'LitElement'
  );
};

const _isLitElementModule = (file: ts.SourceFile) => {
  return file.fileName.endsWith('/node_modules/lit-element/lit-element.d.ts');
};

/**
 * This type identifies a ClassDeclaration as one that inherits from LitElement.
 *
 * It lets isLitElement function as a type predicate that returns whether or
 * not its argument is a LitElement such that when it returns false TypeScript
 * doesn't infer that the argument is not a ClassDeclaration.
 */
export type LitClassDeclaration = ts.ClassLikeDeclaration & {
  __litBrand: never;
};

/**
 * Returns true if `node` is a ClassLikeDeclaration that extends LitElement.
 */
export const isLitElement = (
  node: ts.Node,
  checker: ts.TypeChecker
): node is LitClassDeclaration => {
  if (!ts.isClassLike(node)) {
    return false;
  }
  const type = checker.getTypeAtLocation(node) as ts.InterfaceType;
  const baseTypes = checker.getBaseTypes(type);
  for (const t of baseTypes) {
    if (_isLitElementClassDeclaration(t)) {
      return true;
    }
  }
  return false;
};

/**
 * Returns the tagname associated with a
 * @param declaration
 * @returns
 */
export const getTagName = (declaration: LitClassDeclaration) => {
  // TODO (justinfagnani): support customElements.define()
  let tagname: string | undefined = undefined;
  const customElementDecorator = declaration.decorators?.find(
    isCustomElementDecorator
  );
  if (
    customElementDecorator !== undefined &&
    customElementDecorator.expression.arguments.length === 1 &&
    ts.isStringLiteral(customElementDecorator.expression.arguments[0])
  ) {
    tagname = customElementDecorator.expression.arguments[0].text;
  }
  return tagname;
};

const isCustomElementDecorator = (
  decorator: ts.Decorator
): decorator is CustomElementDecorator =>
  ts.isCallExpression(decorator.expression) &&
  ts.isIdentifier(decorator.expression.expression) &&
  decorator.expression.expression.getText() === 'customElement';

/**
 * A narrower type for ts.Decorator that represents the shape of an analyzable
 * `@customElement('x')` callsite.
 */
interface CustomElementDecorator extends ts.Decorator {
  readonly expression: ts.CallExpression;
}
