/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import * as ts from 'typescript';

/**
 * Return each class declaration in the given nodes lineage, including the given
 * node. Use the given type checker for resolving parent class names.
 */
export function* getHeritage(
  node: ts.ClassDeclaration,
  checker: ts.TypeChecker
): IterableIterator<ts.ClassDeclaration> {
  yield node;
  const parentTypedExpression = getSuperClassTypeExpression(node);

  if (parentTypedExpression === undefined) {
    // No more inheritance.
    return;
  }

  const parentExpression = parentTypedExpression.expression;
  if (!ts.isIdentifier(parentExpression)) {
    // We do not yet support non-identifier expressions in the extends clause.
    return;
  }

  const parentTypeSymbol = checker.getTypeFromTypeNode(
    parentTypedExpression
  ).symbol;
  if (
    parentTypeSymbol === undefined ||
    parentTypeSymbol.declarations === undefined
  ) {
    // Can't resolve symbol for parent type because we don't have access to its
    // source file.
    return;
  }

  const parentDeclaration = parentTypeSymbol
    .declarations[0] as ts.ClassDeclaration;
  yield* getHeritage(parentDeclaration, checker);
}

/**
 * Get the type node for the superclass of the given class declaration.
 */
function getSuperClassTypeExpression(
  classDeclaration: ts.ClassDeclaration
): ts.ExpressionWithTypeArguments | undefined {
  if (classDeclaration.heritageClauses === undefined) {
    return;
  }
  const extendsClause = classDeclaration.heritageClauses.find(
    (clause) => clause.token === ts.SyntaxKind.ExtendsKeyword
  );
  if (extendsClause === undefined) {
    return;
  }
  // Classes can only extend a single expression, so it is safe to get the first
  // type.
  const parentExpression = extendsClause.types[0];
  return parentExpression;
}
