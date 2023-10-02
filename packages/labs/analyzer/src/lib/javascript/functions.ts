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

import type ts from 'typescript';
import {createDiagnostic} from '../errors.js';
import {
  AnalyzerInterface,
  DeclarationInfo,
  FunctionDeclaration,
  FunctionLikeInit,
  FunctionOverloadDeclaration,
  Parameter,
  Return,
} from '../model.js';
import {getTypeForNode, getTypeForType} from '../types.js';
import {parseJSDocDescription, parseNodeJSDocInfo} from './jsdoc.js';
import {hasDefaultModifier, hasExportModifier} from '../utils.js';

export type TypeScript = typeof ts;

/**
 * Returns the name of a function declaration.
 */
const getFunctionDeclarationName = (
  declaration: ts.FunctionDeclaration,
  analyzer: AnalyzerInterface
) => {
  const name =
    declaration.name?.text ??
    // The only time a function declaration will not have a name is when it is
    // a default export, aka `export default function() {...}`
    (hasDefaultModifier(analyzer.typescript, declaration)
      ? 'default'
      : undefined);
  if (name === undefined) {
    analyzer.addDiagnostic(
      createDiagnostic({
        typescript: analyzer.typescript,
        node: declaration,
        message:
          'Illegal syntax: expected every function declaration to either have a name or be a default export',
      })
    );
  }
  return name;
};

export const getFunctionDeclarationInfo = (
  declaration: ts.FunctionDeclaration,
  analyzer: AnalyzerInterface
): DeclarationInfo | undefined => {
  const name = getFunctionDeclarationName(declaration, analyzer);
  if (name === undefined) {
    return undefined;
  }
  return {
    name,
    node: declaration,
    factory: () => getFunctionDeclaration(declaration, name, analyzer),
    isExport: hasExportModifier(analyzer.typescript, declaration),
  };
};

/**
 * Returns an analyzer `FunctionDeclaration` model for the given
 * ts.FunctionLikeDeclaration.
 *
 * Note, the `docNode` may differ from the `declaration` in the case of a const
 * assignment to a class expression, as the JSDoc will be attached to the
 * VariableStatement rather than the class-like expression.
 */
export const getFunctionDeclaration = (
  declaration: ts.FunctionLikeDeclaration,
  name: string,
  analyzer: AnalyzerInterface,
  docNode?: ts.Node
): FunctionDeclaration => {
  return new FunctionDeclaration({
    ...parseNodeJSDocInfo(docNode ?? declaration, analyzer),
    ...getFunctionLikeInfo(declaration, name, analyzer),
  });
};

/**
 * Returns information on FunctionLike nodes
 */
export const getFunctionLikeInfo = (
  node: ts.FunctionLikeDeclaration,
  name: string,
  analyzer: AnalyzerInterface
): FunctionLikeInit => {
  let overloads = undefined;
  if (node.body) {
    // Overloaded functions have multiple declaration nodes.
    const type = analyzer.program.getTypeChecker().getTypeAtLocation(node);
    const overloadDeclarations = type
      .getSymbol()
      ?.getDeclarations()
      ?.filter((x) => x !== node) as Array<ts.FunctionLikeDeclaration>;

    overloads = overloadDeclarations?.map((overload) => {
      const info = getFunctionLikeInfo(overload, name, analyzer);
      return new FunctionOverloadDeclaration({
        // `docNode ?? overload` isn't needed here because TS doesn't allow
        // const function assignments to be overloaded as of now.
        ...parseNodeJSDocInfo(overload, analyzer),

        // `info` can't be spread because `FunctionLikeInit` has an `overloads`
        // property, even though it's always `undefined` in this case.
        name: info.name,
        parameters: info.parameters,
        return: info.return,
        node: overload,
      });
    });
  }

  return {
    name,
    parameters: node.parameters.map((p) => getParameter(p, analyzer)),
    return: getReturn(node, analyzer),
    overloads,
    node,
  };
};

const getParameter = (
  param: ts.ParameterDeclaration,
  analyzer: AnalyzerInterface
): Parameter => {
  const paramTag = analyzer.typescript.getAllJSDocTagsOfKind(
    param,
    analyzer.typescript.SyntaxKind.JSDocParameterTag
  )[0];
  const p: Parameter = {
    name: param.name.getText(),
    type: getTypeForNode(param, analyzer),
    ...(paramTag ? parseJSDocDescription(paramTag, analyzer) : {}),
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
): Return | undefined => {
  const returnTag = analyzer.typescript.getAllJSDocTagsOfKind(
    node,
    analyzer.typescript.SyntaxKind.JSDocReturnTag
  )[0];
  const signature = analyzer.program
    .getTypeChecker()
    .getSignatureFromDeclaration(node);
  if (signature === undefined) {
    // TODO: when does this happen? is it actionable for the user? if so, how?
    analyzer.addDiagnostic(
      createDiagnostic({
        typescript: analyzer.typescript,
        node,
        message: `Could not get signature to determine return type`,
      })
    );
    return undefined;
  }
  return {
    type: getTypeForType(signature.getReturnType(), node, analyzer),
    ...(returnTag ? parseJSDocDescription(returnTag, analyzer) : {}),
  };
};
