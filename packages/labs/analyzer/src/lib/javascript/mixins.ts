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
import {AnalyzerInterface, MixinDeclaration} from '../model.js';
import {getClassDeclaration} from './classes.js';
import {createDiagnostic} from '../errors.js';
import {DiagnosticCode} from '../diagnostic-code.js';

const nodeHasMixinHint = (node: ts.Node) =>
  ts.getJSDocTags(node).some((tag) => tag.tagName.text === 'mixin');

const addDiagnosticIfMixin = (
  node: ts.Node,
  hasMixinHint: boolean,
  message: string,
  analyzer: AnalyzerInterface
) => {
  if (hasMixinHint) {
    analyzer.addDiagnostic(
      createDiagnostic({
        typescript: analyzer.typescript,
        node,
        message,
        code: DiagnosticCode.UNSUPPORTED,
        category: analyzer.typescript.DiagnosticCategory.Warning,
      })
    );
  }
  return undefined;
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
  analyzer: AnalyzerInterface
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
    addDiagnosticIfMixin(
      declaration,
      hasMixinHint,
      `Expected mixin to be defined as a single const assignment to an ` +
        `arrow function or function expression.`,
      analyzer
    );
    return undefined;
  }
  return maybeGetMixinFromFunctionLike(
    initializer,
    declaration.name.getText(),
    analyzer,
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
  name: string,
  analyzer: AnalyzerInterface,
  hasMixinHint = nodeHasMixinHint(fn)
) => {
  if (!fn.parameters || fn.parameters.length < 1) {
    addDiagnosticIfMixin(
      fn,
      hasMixinHint,
      `Expected mixin to have a superClass parameter.`,
      analyzer
    );
    return undefined;
  }
  const possibleSuperClasses = fn.parameters.map((p) =>
    ts.isIdentifier(p.name) ? p.name.text : ''
  );
  const functionBody = fn.body;
  if (functionBody === undefined) {
    addDiagnosticIfMixin(
      fn,
      hasMixinHint,
      `Expected mixin to have a block function body.`,
      analyzer
    );
    return undefined;
  }
  if (!ts.isBlock(functionBody)) {
    addDiagnosticIfMixin(
      fn,
      hasMixinHint,
      `Expected mixin to have a block function body; arrow-function class ` +
        `expression syntax is not supported.`,
      analyzer
    );
    return undefined;
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
    addDiagnosticIfMixin(
      fn,
      hasMixinHint,
      `Expected mixin to contain a class declaration statement.`,
      analyzer
    );
    return undefined;
  }
  if (!returnStatement) {
    addDiagnosticIfMixin(
      fn,
      hasMixinHint,
      `Expected mixin to contain a return statement returning a class.`,
      analyzer
    );
    return undefined;
  }
  const extendsClause = classDeclaration.heritageClauses?.find(
    (c) => c.token === ts.SyntaxKind.ExtendsKeyword
  );
  if (extendsClause === undefined) {
    addDiagnosticIfMixin(
      fn,
      hasMixinHint,
      `Expected mixin to contain class declaration extending a superClass argument to function.`,
      analyzer
    );
    return undefined;
  }
  if (extendsClause.types.length !== 1) {
    analyzer.addDiagnostic(
      createDiagnostic({
        typescript: analyzer.typescript,
        node: extendsClause,
        message:
          'Internal error: did not expect a mixin class extends clause to have multiple types',
        code: DiagnosticCode.UNSUPPORTED,
        category: analyzer.typescript.DiagnosticCategory.Warning,
      })
    );
    return undefined;
  }
  const superClassArgIdx = findSuperClassArgIndexFromHeritage(
    possibleSuperClasses,
    extendsClause.types[0].expression
  );
  if (superClassArgIdx < 0) {
    analyzer.addDiagnostic(
      createDiagnostic({
        typescript: analyzer.typescript,
        node: extendsClause,
        message:
          'Did not find a "superClass" argument used in the extends clause of mixin class.',
        code: DiagnosticCode.UNSUPPORTED,
        category: analyzer.typescript.DiagnosticCategory.Warning,
      })
    );
    return undefined;
  }

  // TODO (43081j): deal with empty class declaration names properly, maybe
  // throw an error?
  const classDeclarationName = classDeclaration.name?.text ?? 'unknown';

  return new MixinDeclaration({
    node: fn,
    name,
    superClassArgIdx,
    classDeclaration: getClassDeclaration(
      classDeclaration,
      classDeclarationName,
      true,
      analyzer
    ),
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
