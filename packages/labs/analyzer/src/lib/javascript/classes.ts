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

/**
 * Returns an analyzer `ClassDeclaration` model for the given
 * ts.ClassDeclaration.
 */
const getClassDeclaration = (
  declaration: ts.ClassDeclaration,
  analyzer: AnalyzerInterface
) => {
  if (isLitElementSubclass(declaration, analyzer)) {
    return getLitElementDeclaration(declaration, analyzer);
  }
  return new ClassDeclaration({
    // TODO(kschaaf): support anonymous class expressions when assigned to a const
    name: declaration.name?.text ?? '',
    node: declaration,
    getHeritage: () => getHeritage(declaration, analyzer),
    ...parseNodeJSDocInfo(declaration, analyzer),
    ...getClassMembers(declaration, analyzer),
  });
};

/**
 * Returns the `fields` and `methods` of a class.
 */
export const getClassMembers = (
  declaration: ts.ClassDeclaration,
  analyzer: AnalyzerInterface
) => {
  const fields: ClassField[] = [];
  const methods: ClassMethod[] = [];
  ts.forEachChild(declaration, (node) => {
    if (ts.isMethodDeclaration(node)) {
      methods.push(
        new ClassMethod({
          ...getMemberInfo(node),
          ...getFunctionLikeInfo(node, analyzer),
          ...parseNodeJSDocInfo(node, analyzer),
        })
      );
    } else if (ts.isPropertyDeclaration(node)) {
      fields.push(
        new ClassField({
          ...getMemberInfo(node),
          type: getTypeForNode(node, analyzer),
          ...parseNodeJSDocInfo(node, analyzer),
        })
      );
    }
  });
  return {
    fields,
    methods,
  };
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
    hasDefaultModifier(declaration)
      ? 'default'
      : undefined;
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
    factory: () => getClassDeclaration(declaration, analyzer),
    isExport: hasExportModifier(declaration),
  };
};

/**
 * Returns the superClass and any applied mixins for a given class declaration.
 */
export const getHeritage = (
  declaration: ts.ClassLikeDeclarationBase,
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
  analyzer: AnalyzerInterface
): ClassHeritage => {
  // TODO(kschaaf): Support for extracting mixing applications from the heritage
  // expression https://github.com/lit/lit/issues/2998
  const mixins: Reference[] = [];
  const superClass = getSuperClass(expression, analyzer);
  return {
    superClass,
    mixins,
  };
};

export const getSuperClass = (
  expression: ts.Expression,
  analyzer: AnalyzerInterface
): Reference => {
  // TODO(kschaaf) Could add support for inline class expressions here as well
  if (ts.isIdentifier(expression)) {
    return getReferenceForIdentifier(expression, analyzer);
  }
  throw new DiagnosticsError(
    expression,
    `Expected expression to be a concrete superclass. Mixins are not yet supported.`
  );
};
