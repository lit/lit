/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

/**
 * @fileoverview
 *
 * Utilities for analyzing class declarations
 */

import ts from 'typescript';
import {DiagnosticsError} from '../errors.js';
import {
  ClassDeclaration,
  AnalyzerInterface,
  DeclarationInfo,
  ClassHeritage,
  Reference,
  ClassField,
  ClassMethod,
  MixinDeclaration,
} from '../model.js';
import {
  isLitElementSubclass,
  getLitElementDeclaration,
} from '../lit-element/lit-element.js';
import {getReferenceForIdentifier} from '../references.js';
import {parseNodeJSDocInfo} from './jsdoc.js';
import {
  hasDefaultModifier,
  hasStaticModifier,
  hasExportModifier,
  getPrivacy,
} from '../utils.js';
import {getFunctionLikeInfo} from './functions.js';
import {getTypeForNode} from '../types.js';
import {
  isCustomElementSubclass,
  getCustomElementDeclaration,
} from '../custom-elements/custom-elements.js';

/**
 * Returns an analyzer `ClassDeclaration` model for the given
 * ts.ClassDeclaration.
 */
export const getClassDeclaration = (
  declaration: ts.ClassLikeDeclaration,
  isMixinClass: boolean,
  analyzer: AnalyzerInterface
) => {
  if (isLitElementSubclass(declaration, analyzer)) {
    return getLitElementDeclaration(declaration, analyzer);
  }
  if (isCustomElementSubclass(declaration, analyzer)) {
    return getCustomElementDeclaration(declaration, analyzer);
  }
  return new ClassDeclaration({
    // TODO(kschaaf): support anonymous class expressions when assigned to a const
    name: declaration.name?.text ?? '',
    node: declaration,
    getHeritage: () => getHeritage(declaration, isMixinClass, analyzer),
    ...parseNodeJSDocInfo(declaration),
    ...getClassMembers(declaration, analyzer),
  });
};

/**
 * Returns the `fields` and `methods` of a class.
 */
export const getClassMembers = (
  declaration: ts.ClassLikeDeclaration,
  analyzer: AnalyzerInterface
) => {
  const fieldMap = new Map<string, ClassField>();
  const staticFieldMap = new Map<string, ClassField>();
  const methodMap = new Map<string, ClassMethod>();
  const staticMethodMap = new Map<string, ClassMethod>();
  declaration.members.forEach((node) => {
    if (ts.isMethodDeclaration(node)) {
      const info = getMemberInfo(node);
      (info.static ? staticMethodMap : methodMap).set(
        node.name.getText(),
        new ClassMethod({
          ...info,
          ...getFunctionLikeInfo(node, analyzer),
          ...parseNodeJSDocInfo(node),
        })
      );
    } else if (ts.isPropertyDeclaration(node)) {
      const info = getMemberInfo(node);
      (info.static ? staticFieldMap : fieldMap).set(
        node.name.getText(),
        new ClassField({
          ...info,
          default: node.initializer?.getText(),
          type: getTypeForNode(node, analyzer),
          ...parseNodeJSDocInfo(node),
        })
      );
    } else if (ts.isConstructorDeclaration(node)) {
      addConstructorFields(node, fieldMap, analyzer);
    }
  });
  return {
    fieldMap,
    staticFieldMap,
    methodMap,
    staticMethodMap,
  };
};

/**
 * Add ClassFields that are defined via an initializer in the
 * constructor only
 */
const addConstructorFields = (
  ctor: ts.ConstructorDeclaration,
  fieldMap: Map<string, ClassField>,
  analyzer: AnalyzerInterface
) => {
  ctor.body?.statements.forEach((stmt) => {
    // Look for initializers in the form of `this.foo = xxxx`
    if (
      ts.isExpressionStatement(stmt) &&
      ts.isBinaryExpression(stmt.expression) &&
      ts.isPropertyAccessExpression(stmt.expression.left) &&
      stmt.expression.left.expression.kind === ts.SyntaxKind.ThisKeyword &&
      ts.isIdentifier(stmt.expression.left.name)
    ) {
      const name = stmt.expression.left.name.text;
      const initializer = stmt.expression.right;
      fieldMap.set(
        name,
        new ClassField({
          name,
          static: false,
          privacy: getPrivacy(stmt),
          default: initializer.getText(),
          type: getTypeForNode(initializer, analyzer),
          ...parseNodeJSDocInfo(stmt),
        })
      );
    }
  });
};

const getMemberInfo = (node: ts.MethodDeclaration | ts.PropertyDeclaration) => {
  return {
    name: node.name.getText(),
    static: hasStaticModifier(node),
    privacy: getPrivacy(node),
  };
};

/**
 * Returns the name of a class declaration.
 */
const getClassDeclarationName = (declaration: ts.ClassDeclaration) => {
  const name =
    declaration.name?.text ??
    // The only time a class declaration will not have a name is when it is
    // a default export, aka `export default class { }`
    (hasDefaultModifier(declaration) ? 'default' : undefined);
  if (name === undefined) {
    throw new DiagnosticsError(
      declaration,
      'Unexpected class declaration without a name'
    );
  }
  return name;
};

/**
 * Returns name and model factory for a class declaration.
 */
export const getClassDeclarationInfo = (
  declaration: ts.ClassDeclaration,
  analyzer: AnalyzerInterface
): DeclarationInfo => {
  return {
    name: getClassDeclarationName(declaration),
    factory: () => getClassDeclaration(declaration, false, analyzer),
    isExport: hasExportModifier(declaration),
  };
};

/**
 * Returns the superClass and any applied mixins for a given class declaration.
 */
export const getHeritage = (
  declaration: ts.ClassLikeDeclarationBase,
  isMixinClass: boolean,
  analyzer: AnalyzerInterface
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
      analyzer
    );
  }
  // No extends clause; return empty heritage
  return {
    mixins: [],
    superClass: undefined,
  };
};

export const getHeritageFromExpression = (
  expression: ts.Expression,
  isMixinClass: boolean,
  analyzer: AnalyzerInterface
): ClassHeritage => {
  // TODO(kschaaf): Support for extracting mixing applications from the heritage
  // expression https://github.com/lit/lit/issues/2998
  const mixins: Reference[] = [];
  const superClass = getSuperClassAndMixins(expression, mixins, analyzer);
  return {
    superClass: isMixinClass ? undefined : superClass,
    mixins,
  };
};

export const getSuperClassAndMixins = (
  expression: ts.Expression,
  foundMixins: Reference[],
  analyzer: AnalyzerInterface
): Reference => {
  // TODO(kschaaf) Could add support for inline class expressions here as well
  if (ts.isIdentifier(expression)) {
    return getReferenceForIdentifier(expression, analyzer);
  } else if (
    ts.isCallExpression(expression) &&
    ts.isIdentifier(expression.expression)
  ) {
    const mixinRef = getReferenceForIdentifier(expression.expression, analyzer);
    // We need to eagerly dereference a mixin ref to know what argument the
    // super class is passed into
    const mixin = mixinRef.dereference(MixinDeclaration);
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
    const superClass = getSuperClassAndMixins(superArg, foundMixins, analyzer);
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
  analyzer: AnalyzerInterface
): ClassDeclaration | undefined => {
  if (ts.isCallExpression(expression)) {
    const heritage = getHeritageFromExpression(expression, false, analyzer);
    if (heritage.superClass) {
      return new ClassDeclaration({
        name: identifier.text,
        node: expression,
        getHeritage: () => heritage,
      });
    }
  }
  return undefined;
};
