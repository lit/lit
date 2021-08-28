/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import * as ts from 'typescript';
import * as pathLib from 'path';
import * as fs from 'fs';

/**
 * Return whether the given node is annotated with the `static` keyword.
 */
export const isStatic = (node: ts.Node): boolean =>
  node.modifiers?.find(
    (modifier) => modifier.kind === ts.SyntaxKind.StaticKeyword
  ) !== undefined;

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
export function getSuperClassTypeExpression(
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

/**
 * Walk up the filesystem directory tree starting from the given path until a
 * `package.json` file is found, and return the "name" field from it.
 *
 * @throws If an unexpected filesystem error occured, or if a `package.json`
 * file contained invalid JSON.
 */
export function getOwningNpmPackageOfFile(path: string): string | undefined {
  let packageJsonStr: string | undefined;
  let dir = path;
  for (;;) {
    const possiblePackageJsonPath = pathLib.join(dir, 'package.json');
    try {
      packageJsonStr = fs.readFileSync(possiblePackageJsonPath, 'utf8');
      break;
    } catch (e) {
      if (!(e.code === 'ENOTDIR' || e.code == 'ENOENT')) {
        throw e;
      }
    }
    const parent = pathLib.dirname(dir);
    if (parent === dir) {
      // This happens when we hit the root.
      break;
    }
    dir = parent;
  }
  if (!packageJsonStr) {
    return undefined;
  }
  const packageJson = JSON.parse(packageJsonStr) as {name?: string};
  return packageJson.name;
}

/**
 * A cache for extendsReactiveElement because it's a somewhat expensive check
 * that requires walking class heritage, querying the type checker, and reading
 * the filesystem.
 */
const extendsReactiveElementCache = new WeakMap<ts.ClassDeclaration, boolean>();

/**
 * Return whether this class extends the official Lit ReactiveElement base
 * class.
 */
export const extendsReactiveElement = (
  class_: ts.ClassDeclaration,
  checker: ts.TypeChecker
): boolean => {
  let result = false;
  const allClasses = [];
  for (const c of getHeritage(class_, checker)) {
    // Note getHeritage includes the class itself.
    const cached = extendsReactiveElementCache.get(c);
    if (cached !== undefined) {
      return cached;
    }
    allClasses.push(c);
    if (
      c.name?.getText() === 'ReactiveElement' &&
      getOwningNpmPackageOfFile(c.getSourceFile().fileName) ===
        '@lit/reactive-element'
    ) {
      result = true;
      break;
    }
  }
  for (const c of allClasses) {
    extendsReactiveElementCache.set(c, result);
  }
  return result;
};
