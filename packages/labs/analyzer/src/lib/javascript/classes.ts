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
  ManifestJson,
  MixinDeclaration,
  Reference,
} from '../model.js';
import {
  isLitElement,
  getLitElementDeclaration,
} from '../lit-element/lit-element.js';
import {DiagnosticsError} from '../errors.js';
import {getReferenceForIdentifier} from '../references.js';

export const getClassDeclaration = (
  declaration: ts.ClassLikeDeclarationBase,
  isMixinClass: boolean,
  context: AnalyzerContext
): ClassDeclaration => {
  if (isLitElement(declaration, context)) {
    return getLitElementDeclaration(declaration, isMixinClass, context);
  } else {
    return new ClassDeclaration({
      name: declaration.name?.text,
      node: declaration,
      getHeritage: () => getHeritage(declaration, isMixinClass, context),
    });
  }
};

/**
 * Returns the superClass and any applied mixins for a given class declaration.
 */
export const getHeritage = (
  declaration: ts.ClassLikeDeclarationBase,
  isMixinClass: boolean,
  context: AnalyzerContext
): ClassHeritage => {
  const extendsClause = declaration.heritageClauses?.find(
    (c) => c.token === ts.SyntaxKind.ExtendsKeyword
  );
  if (extendsClause !== undefined) {
    if (extendsClause.types.length !== 1) {
      throw new DiagnosticsError(
        extendsClause,
        'Internal error: did not expect extends clause to have multiple types'
      );
    }
    return getHeritageFromExpression(
      extendsClause.types[0].expression,
      isMixinClass,
      context
    );
  }
  return {
    mixins: [],
    superClass: undefined,
  };
};

export const getHeritageFromExpression = (
  expression: ts.Expression,
  isMixinClass: boolean,
  context: AnalyzerContext
): ClassHeritage => {
  const mixins: Reference<MixinDeclaration>[] = [];
  const superClass = getSuperClassAndMixins(expression, mixins, context);
  return {
    superClass: isMixinClass ? undefined : superClass,
    mixins,
  };
};

export const getSuperClassAndMixins = (
  expression: ts.Expression,
  foundMixins: Reference<MixinDeclaration>[],
  context: AnalyzerContext
): Reference<ClassDeclaration> => {
  // TODO(kschaaf) Could add support for inline class expressions here as well
  if (ts.isIdentifier(expression)) {
    return getReferenceForIdentifier(expression, context, ClassDeclaration);
  } else if (
    ts.isCallExpression(expression) &&
    ts.isIdentifier(expression.expression)
  ) {
    const mixinRef = getReferenceForIdentifier(
      expression.expression,
      context,
      MixinDeclaration
    );
    // We need to eagerly dereference a mixin ref to know what argument the
    // super class is passed into
    const mixin = mixinRef.dereference();
    if (mixin === undefined) {
      throw new DiagnosticsError(
        expression.expression,
        `This is presumed to be a mixin but could it was not included in ` +
          `the source files of this package and no custom-elements.json ` +
          `was found for it.`
      );
    }
    foundMixins.push(mixinRef);
    const superArg = expression.arguments[mixin.superClassArgIdx];
    const superClass = getSuperClassAndMixins(superArg, foundMixins, context);
    return superClass;
  }
  throw new DiagnosticsError(
    expression,
    `Expected expression to either be a concrete superclass or a mixin`
  );
};

export const maybeGetAppliedMixin = (
  expression: ts.Expression,
  identifier: ts.Identifier,
  context: AnalyzerContext
): ClassDeclaration | undefined => {
  if (ts.isCallExpression(expression)) {
    const heritage = getHeritageFromExpression(expression, false, context);
    if (heritage.superClass) {
      return new ClassDeclaration({
        name: identifier.text,
        getHeritage: () => heritage,
      });
    }
  }
  return undefined;
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
