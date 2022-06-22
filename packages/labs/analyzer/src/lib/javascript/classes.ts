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
import {DiagnosticsError} from '../errors.js';
import {ClassDeclaration, MixinDeclarationNode} from '../model.js';
import {ProgramContext} from '../program-context.js';
import {
  isLitElement,
  getLitElementDeclaration,
} from '../lit-element/lit-element.js';

export const getClassDeclaration = (
  declaration: ts.ClassDeclaration,
  programContext: ProgramContext
): ClassDeclaration => {
  if (isLitElement(declaration, programContext)) {
    return getLitElementDeclaration(declaration, programContext);
  } else {
    return new ClassDeclaration({
      name: declaration.name?.text,
      node: declaration,
      ...getHeritage(declaration, programContext),
    });
  }
};

export type Heritage = {
  mixins: MixinDeclarationNode[];
  superClass: ts.Declaration | undefined;
  superClassType: ts.Type | undefined;
};

export const getHeritage = (
  declaration: ts.ClassLikeDeclaration,
  programContext: ProgramContext
): Heritage => {
  const superClassType = getSuperClassType(declaration, programContext);
  let superClass = undefined;
  const mixins: MixinDeclarationNode[] = [];
  const extended = declaration.heritageClauses?.find(
    (c) => c.token === ts.SyntaxKind.ExtendsKeyword
  );
  if (extended !== undefined) {
    if (extended.types.length !== 1) {
      throw new DiagnosticsError(
        extended,
        'Internal error: did not expect extends clause to have multiple types'
      );
    }
    superClass = getSuperClassAndMixins(
      extended.types[0].expression,
      mixins,
      superClassType!,
      programContext
    );
  }
  return {
    mixins,
    superClass,
    superClassType,
  };
};

const getIntersectionTypeSet = (
  type: ts.Type,
  programContext: ProgramContext,
  set = new Set<string>()
): Set<string> => {
  if (type.isIntersection()) {
    type.types.forEach((type) =>
      getIntersectionTypeSet(type, programContext, set)
    );
  } else {
    set.add(programContext.checker.typeToString(type));
  }
  return set;
};

const constructsSubset = (
  fullType: ts.Type,
  expression: ts.Expression,
  programContext: ProgramContext
) => {
  const type = programContext.checker.getTypeAtLocation(expression);
  const fullTypeSet = getIntersectionTypeSet(fullType, programContext);
  for (const t of getIntersectionTypeSet(type, programContext)) {
    const ctorMatch = t.match(/(Constructor<(?<c1>\w+)>)|(typeof (?<c2>\w+))/);
    const constructs = ctorMatch?.groups?.c1 ?? ctorMatch?.groups?.c2;
    if (constructs === undefined || !fullTypeSet.has(constructs)) {
      return false;
    }
  }
  return true;
};

export const getSuperClassAndMixins = (
  expression: ts.Expression,
  mixins: MixinDeclarationNode[],
  superClassType: ts.Type,
  programContext: ProgramContext
): ts.ClassLikeDeclaration | undefined => {
  // Only continue searching for the superClass (and any mixins) if this
  // expression constructs at least a subset of the type of the extends clause
  if (!constructsSubset(superClassType, expression, programContext)) {
    return undefined;
  }
  if (ts.isIdentifier(expression)) {
    // Found the superClass, as a direct identifier in the extends clause or as
    // an argument to a mixin
    const declaration =
      programContext.checker.getSymbolAtLocation(expression)?.declarations?.[0];
    return declaration as ts.ClassLikeDeclaration | undefined;
  } else if (
    ts.isCallExpression(expression) &&
    ts.isIdentifier(expression.expression)
  ) {
    const symbol = programContext.checker.getSymbolAtLocation(
      expression.expression
    );
    const declaration = symbol?.getDeclarations()?.[0];
    mixins.push(declaration as MixinDeclarationNode);
    for (const arg of expression.arguments) {
      const superClass = getSuperClassAndMixins(
        arg,
        mixins,
        superClassType,
        programContext
      );
      if (superClass !== undefined) {
        return superClass;
      }
    }
    return undefined;
  } else {
    // We only look for mixins / superclass in calls or identifiers
    return undefined;
  }
};

export const getSuperClassType = (
  declaration: ts.ClassLikeDeclaration,
  programContext: ProgramContext
): ts.Type | undefined => {
  const type = programContext.checker.getTypeAtLocation(
    declaration
  ) as ts.InterfaceType;
  return programContext.checker.getBaseTypes(type)[0];
};
