/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

export {Analyzer} from './lib/analyzer.js';
export {createPackageAnalyzer} from './lib/analyze-package.js';

export type {
  Package,
  Module,
  Reference,
  Type,
  Event,
  Declaration,
  VariableDeclaration,
  ClassDeclaration,
  LitElementDeclaration,
  LitElementExport,
  PackageJson,
  ModuleWithLitElementDeclarations,
} from './lib/model.js';

export type {AbsolutePath, PackagePath} from './lib/paths.js';

// Any non-type exports below must be safe to use on objects between multiple
// versions of the analyzer library
export {getImportsStringForReferences} from './lib/model.js';
