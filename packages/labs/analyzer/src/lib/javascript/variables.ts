/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

/**
 * @fileoverview
 *
 * Utilities for analyzing variable declarations
 */

import ts from 'typescript';
import {
  VariableDeclaration,
  AnalyzerInterface,
  DeclarationInfo,
  DeprecatableDescribed,
  Declaration,
} from '../model.js';
import {hasExportModifier} from '../utils.js';
import {DiagnosticsError} from '../errors.js';
import {getTypeForNode} from '../types.js';
import {parseNodeJSDocInfo} from './jsdoc.js';
import {getFunctionDeclaration} from './functions.js';
import {getClassDeclaration, maybeGetAppliedMixin} from './classes.js';

type VariableName =
  | ts.Identifier
  | ts.ObjectBindingPattern
  | ts.ArrayBindingPattern;

/**
 * Returns an analyzer `VariableDeclaration` model for the given
 * ts.Identifier within a potentially nested ts.VariableDeclaration.
 */
const getVariableDeclaration = (
  dec: ts.VariableDeclaration | ts.EnumDeclaration,
  name: ts.Identifier,
  isConst: boolean,
  jsDocInfo: DeprecatableDescribed,
  analyzer: AnalyzerInterface
): Declaration => {
  // For const variable declarations initialized to functions or classes, we
  // treat these as FunctionDeclaration and ClassDeclaration, respectively since
  // they are (mostly) unobservably different to the module consumer and we can
  // give better docs this way
  if (
    ts.isVariableDeclaration(dec) &&
    isConst &&
    dec.initializer !== undefined
  ) {
    const {initializer} = dec;
    if (
      ts.isArrowFunction(initializer) ||
      ts.isFunctionExpression(initializer)
    ) {
      return getFunctionDeclaration(initializer, name.getText(), analyzer);
    } else if (ts.isClassExpression(initializer)) {
      return getClassDeclaration(initializer, false, analyzer);
    } else {
      const classDec = maybeGetAppliedMixin(initializer, name, analyzer);
      if (classDec !== undefined) {
        return classDec;
      }
    }
  }
  return new VariableDeclaration({
    name: name.text,
    node: dec,
    type: getTypeForNode(name, analyzer),
    ...jsDocInfo,
  });
};

/**
 * Returns name and model factories for all variable
 * declarations in a variable statement.
 */
export const getVariableDeclarationInfo = (
  statement: ts.VariableStatement,
  analyzer: AnalyzerInterface
): DeclarationInfo[] => {
  const isExport = hasExportModifier(statement);
  const jsDocInfo = parseNodeJSDocInfo(statement);
  const {declarationList} = statement;
  const isConst = Boolean(declarationList.flags & ts.NodeFlags.Const);
  return declarationList.declarations
    .map((d) =>
      getVariableDeclarationInfoList(
        d,
        d.name,
        isExport,
        isConst,
        jsDocInfo,
        analyzer
      )
    )
    .flat();
};

/**
 * For a given `VariableName` (which might be a simple identifier or a
 * destructuring pattern which contains more identifiers), return an array of
 * tuples of name and factory for each declaration.
 */
const getVariableDeclarationInfoList = (
  dec: ts.VariableDeclaration,
  name: VariableName,
  isExport: boolean,
  isConst: boolean,
  jsDocInfo: DeprecatableDescribed,
  analyzer: AnalyzerInterface
): DeclarationInfo[] => {
  if (ts.isIdentifier(name)) {
    return [
      {
        name: name.text,
        factory: () =>
          getVariableDeclaration(dec, name, isConst, jsDocInfo, analyzer),
        isExport,
      },
    ];
  } else if (
    // Recurse into the elements of an array/object destructuring variable
    // declaration to find the identifiers
    ts.isObjectBindingPattern(name) ||
    ts.isArrayBindingPattern(name)
  ) {
    const els = name.elements.filter((el) =>
      ts.isBindingElement(el)
    ) as ts.BindingElement[];
    return els
      .map((el) =>
        getVariableDeclarationInfoList(
          dec,
          el.name,
          isExport,
          isConst,
          jsDocInfo,
          analyzer
        )
      )
      .flat();
  } else {
    throw new DiagnosticsError(
      dec,
      `Expected declaration name to either be an Identifier or a BindingPattern`
    );
  }
};

/**
 * Returns declaration info & factory for a default export assignment.
 */
export const getExportAssignmentVariableDeclarationInfo = (
  exportAssignment: ts.ExportAssignment,
  analyzer: AnalyzerInterface
): DeclarationInfo => {
  return {
    name: 'default',
    factory: () =>
      getExportAssignmentVariableDeclaration(exportAssignment, analyzer),
    isExport: true,
  };
};

/**
 * Returns an analyzer `VariableDeclaration` model for the given default
 * ts.ExportAssignment, handling the case of: `export const 'some expression'`;
 *
 * Note that even though this technically isn't a VariableDeclaration in
 * TS, we model it as one since it could unobservably be implemented as
 * `const varDec = 'some expression'; export {varDec as default} `
 */
const getExportAssignmentVariableDeclaration = (
  exportAssignment: ts.ExportAssignment,
  analyzer: AnalyzerInterface
): VariableDeclaration => {
  return new VariableDeclaration({
    name: 'default',
    node: exportAssignment,
    type: getTypeForNode(exportAssignment.expression, analyzer),
    ...parseNodeJSDocInfo(exportAssignment),
  });
};

export const getEnumDeclarationInfo = (
  statement: ts.EnumDeclaration,
  analyzer: AnalyzerInterface
) => {
  const jsDocInfo = parseNodeJSDocInfo(statement);
  return {
    name: statement.name.text,
    factory: () =>
      getVariableDeclaration(
        statement,
        statement.name,
        false,
        jsDocInfo,
        analyzer
      ),
    isExport: hasExportModifier(statement),
  };
};
