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
import {Analyzer, FunctionDeclaration, MixinDeclaration} from '../model.js';
import {maybeGetMixinFromFunctionLike} from './mixins.js';

export const getFunctionDeclaration = (
  dec: ts.FunctionLikeDeclaration,
  name: ts.Identifier,
  analyzer: Analyzer
): FunctionDeclaration | MixinDeclaration => {
  return (
    maybeGetMixinFromFunctionLike(dec, name, analyzer) ??
    new FunctionDeclaration({
      name: name.getText(),
      node: dec,
    })
  );
};
