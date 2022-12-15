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
import {AnalyzerInterface, Parameter, Return} from '../model.js';
import {getTypeForNode, getTypeForType} from '../types.js';
import {parseJSDocInfo} from './jsdoc.js';

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
    ...(paramTag ? parseJSDocInfo(paramTag) : {}),
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
    ...(returnTag ? parseJSDocInfo(returnTag) : {}),
  };
};
