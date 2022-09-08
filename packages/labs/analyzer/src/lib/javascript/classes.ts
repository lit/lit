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
import {ClassDeclaration, AnalyzerInterface} from '../model.js';

/**
 * Returns an analyzer `ClassDeclaration` model for the given
 * ts.ClassDeclaration.
 */
export const getClassDeclaration = (
  declaration: ts.ClassDeclaration,
  _analyzer: AnalyzerInterface
): ClassDeclaration => {
  return new ClassDeclaration({
    name: declaration.name?.text,
    node: declaration,
  });
};
