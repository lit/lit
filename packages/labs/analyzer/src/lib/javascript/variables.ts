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

import type ts from 'typescript';
import {
  VariableDeclaration,
  AnalyzerInterface,
  DeclarationInfo,
  Declaration,
} from '../model.js';
import {hasExportModifier} from '../utils.js';
import {getTypeForNode} from '../types.js';
import {parseNodeJSDocInfo} from './jsdoc.js';
import {getFunctionDeclaration} from './functions.js';
import {getClassDeclaration} from './classes.js';
import {createDiagnostic} from '../errors.js';
import {DiagnosticCode} from '../diagnostic-code.js';

export type TypeScript = typeof ts;

type VariableName =
  | ts.Identifier
  | ts.ObjectBindingPattern
  | ts.ArrayBindingPattern;

/**
 * Returns an analyzer `VariableDeclaration` model for the given
 * ts.Identifier within a potentially nested ts.VariableDeclaration.
 */
const getVariableDeclaration = (
  statement: ts.VariableStatement,
  dec: ts.VariableDeclaration,
  name: ts.Identifier,
  analyzer: AnalyzerInterface
): Declaration => {
  const {typescript: ts} = analyzer;
  // For const variable declarations initialized to functions or classes, we
  // treat these as FunctionDeclaration and ClassDeclaration, respectively since
  // they are (mostly) unobservably different to the module consumer and we can
  // give better docs this way
  if (
    ts.isVariableDeclaration(dec) &&
    Boolean(statement.declarationList.flags & ts.NodeFlags.Const) &&
    dec.initializer !== undefined
  ) {
    const {initializer} = dec;
    if (
      ts.isArrowFunction(initializer) ||
      ts.isFunctionExpression(initializer)
    ) {
      return getFunctionDeclaration(
        initializer,
        name.getText(),
        analyzer,
        statement
      );
    } else if (ts.isClassExpression(initializer)) {
      return getClassDeclaration(
        initializer,
        name.getText(),
        analyzer,
        statement
      );
    }
  }
  return new VariableDeclaration({
    name: name.text,
    node: dec,
    type: getTypeForNode(name, analyzer),
    ...parseNodeJSDocInfo(statement, analyzer),
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
  const isExport = hasExportModifier(analyzer.typescript, statement);
  const {declarationList} = statement;
  return declarationList.declarations
    .map((d) =>
      getVariableDeclarationInfoList(statement, d, d.name, isExport, analyzer)
    )
    .flat();
};

/**
 * For a given `VariableName` (which might be a simple identifier or a
 * destructuring pattern which contains more identifiers), return an array of
 * tuples of name and factory for each declaration.
 */
const getVariableDeclarationInfoList = (
  statement: ts.VariableStatement,
  dec: ts.VariableDeclaration,
  name: VariableName,
  isExport: boolean,
  analyzer: AnalyzerInterface
): DeclarationInfo[] => {
  const {typescript: ts} = analyzer;
  if (ts.isIdentifier(name)) {
    return [
      {
        name: name.text,
        node: name,
        factory: () => getVariableDeclaration(statement, dec, name, analyzer),
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
          statement,
          dec,
          el.name,
          isExport,
          analyzer
        )
      )
      .flat();
  } else {
    analyzer.addDiagnostic(
      createDiagnostic({
        typescript: ts,
        node: dec,
        message: `Expected declaration name to either be an identifier or a destructuring`,
        category: ts.DiagnosticCategory.Warning,
        code: DiagnosticCode.UNSUPPORTED,
      })
    );
    return [];
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
    node: exportAssignment,
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
    ...parseNodeJSDocInfo(exportAssignment, analyzer),
  });
};

export const getEnumDeclarationInfo = (
  dec: ts.EnumDeclaration,
  analyzer: AnalyzerInterface
) => {
  return {
    name: dec.name.text,
    node: dec,
    factory: () => getEnumDeclaration(dec, analyzer),
    isExport: hasExportModifier(analyzer.typescript, dec),
  };
};

const getEnumDeclaration = (
  dec: ts.EnumDeclaration,
  analyzer: AnalyzerInterface
) => {
  return new VariableDeclaration({
    name: dec.name.text,
    node: dec,
    type: getTypeForNode(dec.name, analyzer),
    ...parseNodeJSDocInfo(dec, analyzer),
  });
};
