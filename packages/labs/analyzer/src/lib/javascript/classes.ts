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
import {ClassDeclaration} from '../model.js';
import {ProgramContext} from '../program-context.js';

export const getClassDeclaration = (
  declaration: ts.ClassDeclaration,
  _programContext: ProgramContext
): ClassDeclaration => {
  return new ClassDeclaration({
    name: declaration.name?.text ?? '',
    node: declaration,
  });
};
