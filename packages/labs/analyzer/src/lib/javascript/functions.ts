/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

/**
 * @fileoverview
 *
 * Utilities for working with functions
 */

import ts from 'typescript';
import {
  AnalyzerContext,
  FunctionDeclaration,
  MixinDeclaration,
} from '../model.js';
import {maybeGetMixinFromFunctionLike} from './mixins.js';

export const getFunctionDeclaration = (
  dec: ts.FunctionLikeDeclaration,
  name: ts.Identifier,
  context: AnalyzerContext
): FunctionDeclaration | MixinDeclaration => {
  return (
    maybeGetMixinFromFunctionLike(dec, name, context) ??
    new FunctionDeclaration({
      name: name.getText(),
      node: dec,
    })
  );
};
