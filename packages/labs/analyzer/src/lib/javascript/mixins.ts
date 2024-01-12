/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

/**
 * @fileoverview
 *
 * Utilities for working with mixins
 */

import type ts from 'typescript';
import {AnalyzerInterface, MixinDeclarationInit} from '../model.js';
import {getClassDeclaration} from './classes.js';
import {createDiagnostic} from '../errors.js';
import {DiagnosticCode} from '../diagnostic-code.js';
import {getSymbolForName} from '../references.js';

const nodeHasMixinHint = (node: ts.Node, analyzer: AnalyzerInterface) =>
  analyzer.typescript
    .getJSDocTags(node)
    .some((tag) => tag.tagName.text === 'mixin');

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
 * MixinDeclaration initialisation object, otherwise returns undefined.
 *
 * The mixin logic requires a few important syntactic heuristics to be met in
 * order to be detected as a mixin:
 *
 * - a super class parameter (by any name) which is later used as a base class
 * - a function body (rather than an arrow function)
 * - an internal class which extends the previously mentioned super class parameter
 * - a return statement returning the class
 *
 * For example:
 *
 * ```
 * function MyMixin(superClass) {
 *   class MixedClass extends superClass {
 *     // ...
 *   }
 *   return MixedClass;
 * }
 * ```
 *
 * You can read more about this pattern in the TypeScript docs here:
 * https://www.typescriptlang.org/docs/handbook/mixins.html
 *
 * If the function is unannotated and does not match the above mixin shape, it
 * will silently just be analyzed as a simple function and not a mixin. However,
 * the `@mixin` annotation can be added to produce specific diagnostic errors
 * when a condition for being analyzed as a mixin is not met.
 */
export const maybeGetMixinFromFunctionLike = (
  fn: ts.FunctionLikeDeclaration,
  name: string,
  analyzer: AnalyzerInterface
): MixinDeclarationInit | undefined => {
  const hasMixinHint = nodeHasMixinHint(fn, analyzer);
  if (fn.parameters === undefined || fn.parameters.length < 1) {
    addDiagnosticIfMixin(
      fn,
      hasMixinHint,
      `Expected mixin to have a superClass parameter.`,
      analyzer
    );
    return undefined;
  }
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
  let classDeclaration: ts.ClassLikeDeclaration | undefined;
  let returnStatement: ts.ReturnStatement | undefined;
  if (analyzer.typescript.isBlock(functionBody)) {
    for (const s of functionBody.statements) {
      if (analyzer.typescript.isClassDeclaration(s)) {
        classDeclaration = s;
      }
      if (analyzer.typescript.isReturnStatement(s)) {
        returnStatement = s;

        if (
          classDeclaration === undefined &&
          s.expression !== undefined &&
          analyzer.typescript.isClassLike(s.expression)
        ) {
          classDeclaration = s.expression;
        }
      }
    }

    if (returnStatement === undefined) {
      addDiagnosticIfMixin(
        fn,
        hasMixinHint,
        `Expected mixin to contain a return statement returning a class.`,
        analyzer
      );
      return undefined;
    }
  } else if (analyzer.typescript.isClassLike(functionBody)) {
    classDeclaration = functionBody;
  }
  if (classDeclaration === undefined) {
    addDiagnosticIfMixin(
      fn,
      hasMixinHint,
      `Expected mixin to contain a class declaration statement.`,
      analyzer
    );
    return undefined;
  }
  const extendsClause = classDeclaration.heritageClauses?.find(
    (c) => c.token === analyzer.typescript.SyntaxKind.ExtendsKeyword
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
  const superClassArgIndex = findSuperClassArgIndexFromHeritage(
    fn,
    extendsClause.types[0].expression,
    analyzer
  );
  if (superClassArgIndex < 0) {
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

  const classDeclarationName = classDeclaration.name?.text ?? name;

  return {
    node: fn,
    name,
    superClassArgIndex,
    classDeclaration: getClassDeclaration(
      classDeclaration,
      classDeclarationName,
      analyzer,
      undefined,
      true /* isMixinClass */
    ),
  };
};

const findSuperClassArgIndexFromHeritage = (
  mixinFunction: ts.FunctionLikeDeclaration,
  expression: ts.Expression,
  analyzer: AnalyzerInterface
): number => {
  if (analyzer.typescript.isIdentifier(expression)) {
    const paramSymbol = getSymbolForName(expression.text, expression, analyzer);

    if (paramSymbol?.declarations) {
      const paramDecl = paramSymbol.declarations;
      return mixinFunction.parameters.findIndex((param) =>
        paramDecl.includes(param)
      );
    }
  } else if (analyzer.typescript.isCallExpression(expression)) {
    for (const arg of expression.arguments) {
      const index = findSuperClassArgIndexFromHeritage(
        mixinFunction,
        arg,
        analyzer
      );
      if (index >= 0) {
        return index;
      }
    }
  }
  return -1;
};
