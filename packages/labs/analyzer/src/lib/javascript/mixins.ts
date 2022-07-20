/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

/**
 * @fileoverview
 *
 * Utilities for working with mixins
 */

import ts from 'typescript';
import {DiagnosticsError} from '../errors.js';
import {AnalyzerContext, MixinDeclaration} from '../model.js';
import {getClassDeclaration} from './classes.js';

const nodeHasMixinHint = (node: ts.Node) =>
  ts.getJSDocTags(node).some((tag) => tag.tagName.text === 'mixin');

const throwIfMixin = (
  hasMixinHint: boolean,
  node: ts.Node,
  message: string
) => {
  if (hasMixinHint) {
    throw new DiagnosticsError(node, message);
  } else {
    return undefined;
  }
};

/**
 * If the given variable declaration was a mixin function, returns a
 * MixinDeclaration, otherwise returns undefined.
 *
 * The mixin logic requires a few important syntactic heuristics to be met in
 * order to be detected as a mixin.
 *
 * If the function is unannotated and does not match the above mixin shape, it
 * will silently just be analyzed as a simple function and not a mixin. However,
 * the `@mixin` annotation can be added to produce specific diagnostic errors
 * when a condition for being analyzed as a mixin is not met.
 */
export const maybeGetMixinFromVariableDeclaration = (
  declaration: ts.VariableDeclaration,
  context: AnalyzerContext
): MixinDeclaration | undefined => {
  const hasMixinHint = nodeHasMixinHint(declaration);
  const initializer = declaration.initializer;
  if (
    initializer === undefined ||
    !(
      ts.isArrowFunction(initializer) || ts.isFunctionExpression(initializer)
    ) ||
    !ts.isIdentifier(declaration.name)
  ) {
    return throwIfMixin(
      hasMixinHint,
      initializer ?? declaration,
      `Expected mixin to be defined as a single const assignment to an ` +
        `arrow function or function expression.`
    );
  }
  return maybeGetMixinFromFunctionLike(
    initializer,
    declaration.name,
    context,
    hasMixinHint
  );
};

/**
 * If the given variable declaration was a mixin function, returns a
 * MixinDeclaration, otherwise returns undefined.
 *
 * The mixin logic requires a few important syntactic heuristics to be met in
 * order to be detected as a mixin.
 *
 * If the function is unannotated and does not match the above mixin shape, it
 * will silently just be analyzed as a simple function and not a mixin. However,
 * the `@mixin` annotation can be added to produce specific diagnostic errors
 * when a condition for being analyzed as a mixin is not met.
 */
export const maybeGetMixinFromFunctionLike = (
  fn: ts.FunctionLikeDeclaration,
  name: ts.Identifier,
  context: AnalyzerContext,
  hasMixinHint = nodeHasMixinHint(fn)
) => {
  if (!fn.parameters || fn.parameters.length < 1) {
    return throwIfMixin(
      hasMixinHint,
      fn,
      `Expected mixin to have a superClass parameter.`
    );
  }
  const possibleSuperClasses = fn.parameters.map((p) =>
    ts.isIdentifier(p.name) ? p.name.text : ''
  );
  const functionBody = fn.body;
  if (functionBody === undefined) {
    return throwIfMixin(
      hasMixinHint,
      fn,
      `Expected mixin to have a block function body.`
    );
  }
  if (!ts.isBlock(functionBody)) {
    return throwIfMixin(
      hasMixinHint,
      functionBody,
      `Expected mixin to have a block function body; arrow-function class ` +
        `expression syntax is not supported.`
    );
  }
  let classDeclaration!: ts.ClassDeclaration;
  let returnStatement!: ts.ReturnStatement;
  functionBody.statements.forEach((s) => {
    if (ts.isClassDeclaration(s)) {
      classDeclaration = s;
    }
    if (ts.isReturnStatement(s)) {
      returnStatement = s;
    }
  });
  if (!classDeclaration) {
    return throwIfMixin(
      hasMixinHint,
      functionBody,
      `Expected mixin to contain a class declaration statement.`
    );
  }
  if (!returnStatement) {
    return throwIfMixin(
      hasMixinHint,
      functionBody,
      `Expected mixin to contain a return statement returning a class.`
    );
  }
  const extendsClause = classDeclaration.heritageClauses?.find(
    (c) => c.token === ts.SyntaxKind.ExtendsKeyword
  );
  if (extendsClause === undefined) {
    return throwIfMixin(
      hasMixinHint,
      classDeclaration,
      `Expected mixin to contain class declaration extending a superClass argument to function.`
    );
  }
  if (extendsClause.types.length !== 1) {
    throw new DiagnosticsError(
      extendsClause,
      'Internal error: did not expect a mixin class extends clause to have multiple types'
    );
  }
  const superClassArgIdx = findSuperClassArgIndexFromHeritage(
    possibleSuperClasses,
    extendsClause.types[0].expression
  );
  if (superClassArgIdx < 0) {
    throw new DiagnosticsError(
      extendsClause,
      'Did not find a "superClass" argument used in the extends clause of mixin class.'
    );
  }

  return new MixinDeclaration({
    node: fn,
    name: name.getText(),
    superClassArgIdx,
    classDeclaration: getClassDeclaration(classDeclaration, true, context),
  });
};

const findSuperClassArgIndexFromHeritage = (
  possibleSuperClasses: string[],
  expression: ts.Expression
): number => {
  if (ts.isIdentifier(expression)) {
    return possibleSuperClasses.indexOf(expression.text);
  } else if (ts.isCallExpression(expression)) {
    for (const arg of expression.arguments) {
      const index = findSuperClassArgIndexFromHeritage(
        possibleSuperClasses,
        arg
      );
      if (index >= 0) {
        return index;
      }
    }
  }
  return -1;
};
