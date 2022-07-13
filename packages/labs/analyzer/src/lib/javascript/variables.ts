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
import {VariableDeclaration} from '../model.js';
import {ProgramContext} from '../program-context.js';
import {DiagnosticsError} from '../errors.js';

type VariableName =
  | ts.Identifier
  | ts.ObjectBindingPattern
  | ts.ArrayBindingPattern;

export const getVariableDeclarations = (
  dec: ts.VariableDeclaration,
  name: VariableName,
  programContext: ProgramContext
): VariableDeclaration[] => {
  if (ts.isIdentifier(name)) {
    return [
      new VariableDeclaration({
        name: name.text,
        node: dec,
        type: programContext.getTypeForNode(name),
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
      .map((el) => getVariableDeclarations(dec, el.name, programContext))
      .flat();
  } else {
    throw new DiagnosticsError(
      dec,
      `Expected declaration name to either be an Identifier or a BindingPattern`
    );
  }
};
