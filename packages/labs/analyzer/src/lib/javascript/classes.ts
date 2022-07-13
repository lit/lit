/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

/**
 * @fileoverview
 *
 * Utilities for working with classes
 */

import ts from 'typescript';
import {
  AnalyzerContext,
  ClassDeclaration,
  ClassHeritage,
  MixinDeclaration,
  ManifestJson,
} from '../model.js';
import {
  isLitElement,
  getLitElementDeclaration,
} from '../lit-element/lit-element.js';
import {DiagnosticsError} from '../errors.js';
import {getModelForIdentifier} from '../references.js';

export const getClassDeclaration = (
  declaration: ts.ClassLikeDeclarationBase,
  context: AnalyzerContext
): ClassDeclaration => {
  if (isLitElement(declaration, context)) {
    return getLitElementDeclaration(declaration, context);
  } else {
    return new ClassDeclaration({
      name: declaration.name?.text,
      node: declaration,
      getHeritage: () => getHeritage(declaration, context),
    });
  }
};

/**
 * Returns the superClass and any applied mixins for a given class declaration.
 */
export const getHeritage = (
  declaration: ts.ClassLikeDeclarationBase,
  context: AnalyzerContext
): ClassHeritage => {
  const mixins: MixinDeclaration[] = [];
  const extendsClause = declaration.heritageClauses?.find(
    (c) => c.token === ts.SyntaxKind.ExtendsKeyword
  );
  let superClass;
  if (extendsClause !== undefined) {
    if (extendsClause.types.length !== 1) {
      throw new DiagnosticsError(
        extendsClause,
        'Internal error: did not expect extends clause to have multiple types'
      );
    }
    superClass = getSuperClassAndMixins(
      extendsClause.types[0].expression,
      mixins,
      context
    );
  }
  return {
    mixins,
    superClass,
  };
};

export const getSuperClassAndMixins = (
  expression: ts.Expression,
  foundMixins: MixinDeclaration[],
  context: AnalyzerContext
): ClassDeclaration => {
  // TODO(kschaaf) Could add support for inline class expressions here as well
  if (ts.isIdentifier(expression)) {
    return getModelForIdentifier(expression, context, ClassDeclaration);
  } else if (
    ts.isCallExpression(expression) &&
    ts.isIdentifier(expression.expression)
  ) {
    const mixin = getModelForIdentifier(
      expression.expression,
      context,
      MixinDeclaration
    );
    foundMixins.push(mixin);
    const superArg = expression.arguments[mixin.superClassArgIdx];
    const superClass = getSuperClassAndMixins(superArg, foundMixins, context);
    return superClass;
  }
  throw new DiagnosticsError(
    expression,
    `Expected expression to either be a concrete superclass or a mixin`
  );
};

export const getClassDeclarationFromManifest = (
  declaration: ManifestJson.ClassDeclaration
): ClassDeclaration => {
  return new ClassDeclaration({
    name: declaration.name,
    getHeritage: () => ({
      mixins: [],
      superClass: undefined,
    }),
  });
};
