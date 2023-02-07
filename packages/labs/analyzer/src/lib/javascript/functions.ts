/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

/**
 * @fileoverview
 *
 * Utilities for analyzing function declarations
 */

import ts from 'typescript';
import {DiagnosticsError} from '../errors.js';
import {
  AnalyzerInterface,
  DeclarationInfo,
  FunctionDeclaration,
  Parameter,
  Return,
} from '../model.js';
import {getTypeForNode, getTypeForType} from '../types.js';
import {parseJSDocDescription, parseNodeJSDocInfo} from './jsdoc.js';
import {hasDefaultModifier, hasExportModifier} from '../utils.js';

/**
 * Returns the name of a function declaration.
 */
const getFunctionDeclarationName = (declaration: ts.FunctionDeclaration) => {
  const name =
    declaration.name?.text ??
    // The only time a function declaration will not have a name is when it is
    // a default export, aka `export default function() {...}`
    (hasDefaultModifier(declaration) ? 'default' : undefined);
  if (name === undefined) {
    throw new DiagnosticsError(
      declaration,
      'Unexpected class declaration without a name'
    );
  }
  return name;
};

export const getFunctionDeclarationInfo = (
  declaration: ts.FunctionDeclaration,
  analyzer: AnalyzerInterface
): DeclarationInfo => {
  const name = getFunctionDeclarationName(declaration);
  return {
    name,
    factory: () => getFunctionDeclaration(declaration, name, analyzer),
    isExport: hasExportModifier(declaration),
  };
};

export const getFunctionDeclaration = (
  declaration: ts.FunctionLikeDeclaration,
  name: string,
  analyzer: AnalyzerInterface
): FunctionDeclaration => {
  return new FunctionDeclaration({
    name,
    ...parseNodeJSDocInfo(declaration),
    ...getFunctionLikeInfo(declaration, analyzer),
  });
};

/**
 * Returns information on FunctionLike nodes
 */
export const getFunctionLikeInfo = (
  node: ts.FunctionLikeDeclaration,
  analyzer: AnalyzerInterface
) => {
  return {
    parameters: node.parameters.map((p) => getParameter(p, analyzer)),
    return: getReturn(node, analyzer),
  };
};

const getParameter = (
  param: ts.ParameterDeclaration,
  analyzer: AnalyzerInterface
): Parameter => {
  const paramTag = ts.getAllJSDocTagsOfKind(
    param,
    ts.SyntaxKind.JSDocParameterTag
  )[0];
  const p: Parameter = {
    name: param.name.getText(),
    type: getTypeForNode(param, analyzer),
    ...(paramTag ? parseJSDocDescription(paramTag) : {}),
    optional: false,
    rest: false,
  };
  if (param.initializer !== undefined) {
    p.optional = true;
    p.default = param.initializer.getText();
  }
  if (param.questionToken !== undefined) {
    p.optional = true;
  }
  if (param.dotDotDotToken !== undefined) {
    p.rest = true;
  }
  return p;
};

const getReturn = (
  node: ts.FunctionLikeDeclaration,
  analyzer: AnalyzerInterface
): Return => {
  const returnTag = ts.getAllJSDocTagsOfKind(
    node,
    ts.SyntaxKind.JSDocReturnTag
  )[0];
  const signature = analyzer.program
    .getTypeChecker()
    .getSignatureFromDeclaration(node);
  if (signature === undefined) {
    throw new DiagnosticsError(
      node,
      `Could not get signature to determine return type`
    );
  }
  return {
    type: getTypeForType(signature.getReturnType(), node, analyzer),
    ...(returnTag ? parseJSDocDescription(returnTag) : {}),
  };
};
