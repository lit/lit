/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

/**
 * @fileoverview
 *
 * Utilities for working with variables
 */

import ts from 'typescript';
import {VariableDeclaration, Declaration, AnalyzerContext} from '../model.js';
import {DiagnosticsError} from '../errors.js';
import {getFunctionDeclaration} from './functions.js';
import {getClassDeclaration, maybeGetAppliedMixin} from './classes.js';
import {getTypeForNode} from '../types.js';

type VariableName =
  | ts.Identifier
  | ts.ObjectBindingPattern
  | ts.ArrayBindingPattern;

export const getVariableDeclarations = (
  dec: ts.VariableDeclaration,
  name: VariableName,
  context: AnalyzerContext
): [string, () => Declaration][] => {
  if (ts.isIdentifier(name)) {
    const getVariableDeclaration = () => {
      const initializer = dec.initializer;
      if (initializer !== undefined) {
        if (
          ts.isArrowFunction(initializer) ||
          ts.isFunctionExpression(initializer)
        ) {
          return getFunctionDeclaration(initializer, name, context);
        } else if (ts.isClassExpression(initializer)) {
          return getClassDeclaration(initializer, context);
        } else {
          const classDec = maybeGetAppliedMixin(initializer, name, context);
          if (classDec !== undefined) {
            return classDec;
          }
        }
      }
      return new VariableDeclaration({
        name: name.text,
        node: dec,
        getType: () => getTypeForNode(name, context),
      });
    };
    return [[name.text, getVariableDeclaration]];
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
