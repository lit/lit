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
import {VariableDeclaration, AnalyzerContext} from '../model.js';
import {DiagnosticsError} from '../errors.js';
import {getTypeForNode} from '../types.js';

type VariableName =
  | ts.Identifier
  | ts.ObjectBindingPattern
  | ts.ArrayBindingPattern;

/**
 * Returns an array of analyzer `VariableDeclaration` models for the given
 * ts.VariableDeclaration.
 */
export const getVariableDeclarations = (
  dec: ts.VariableDeclaration,
  name: VariableName,
  context: AnalyzerContext
): VariableDeclaration[] => {
  if (ts.isIdentifier(name)) {
    return [
      new VariableDeclaration({
        name: name.text,
        node: dec,
        type: getTypeForNode(name, context),
      }),
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
      .map((el) => getVariableDeclarations(dec, el.name, context))
      .flat();
  } else {
    throw new DiagnosticsError(
      dec,
      `Expected declaration name to either be an Identifier or a BindingPattern`
    );
  }
};
