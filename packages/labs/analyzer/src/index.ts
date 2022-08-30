/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

export {Analyzer} from './lib/analyzer.js';

export type {
  Package,
  Module,
  Reference,
  Type,
  Declaration,
  VariableDeclaration,
  ClassDeclaration,
  LitElementDeclaration,
  PackageJson,
  ModuleWithDeclarations,
} from './lib/model.js';

export type {AbsolutePath, PackagePath} from './lib/paths.js';

// Any non-type exports below must be safe to use on objects between multiple
// versions of the analyzer library
export {getImportsStringForReferences} from './lib/model.js';
