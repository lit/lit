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
} from '../model.js';
import {isExport} from '../references.js';
import {DiagnosticsError} from '../errors.js';
import {getTypeForNode} from '../types.js';

type VariableName =
  | ts.Identifier
  | ts.ObjectBindingPattern
  | ts.ArrayBindingPattern;

/**
 * Returns an analyzer `VariableDeclaration` model for the given
 * ts.Identifier within a potentially nested ts.VariableDeclaration.
 */
const getVariableDeclaration = (
  dec: ts.VariableDeclaration,
  name: ts.Identifier,
  analyzer: AnalyzerInterface
): VariableDeclaration => {
  return new VariableDeclaration({
    name: name.text,
    node: dec,
    type: getTypeForNode(name, analyzer),
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
  return statement.declarationList.declarations
    .map((d) => getVariableDeclarationInfoList(d, d.name, analyzer))
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
  analyzer: AnalyzerInterface
): DeclarationInfo[] => {
  if (ts.isIdentifier(name)) {
    return [
      {
        name: name.text,
        factory: () => getVariableDeclaration(dec, name, analyzer),
        isExport: isExport(dec),
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
      .map((el) => getVariableDeclarationInfoList(dec, el.name, analyzer))
      .flat();
  } else {
    throw new DiagnosticsError(
      dec,
      `Expected declaration name to either be an Identifier or a BindingPattern`
    );
  }
};
