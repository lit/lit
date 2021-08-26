/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import * as ts from 'typescript';

/**
 * Return whether the given node is annotated with the `static` keyword.
 */
export const isStatic = (node: ts.Node): boolean =>
  node.modifiers?.find(
    (modifier) => modifier.kind === ts.SyntaxKind.StaticKeyword
  ) !== undefined;
