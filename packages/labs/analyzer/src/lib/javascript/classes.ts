/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

/**
 * @fileoverview
 *
 * Utilities for analyzing class declarations
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
    // TODO(kschaaf): support anonymous class expressions when assigned to a const
    name: declaration.name?.text ?? '',
    node: declaration,
  });
};
