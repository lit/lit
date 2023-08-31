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
  Attribute,
  Event,
  Declaration,
  VariableDeclaration,
  ClassDeclaration,
  ClassField,
  CustomElementField,
  ClassMethod,
  Parameter,
  Return,
  LitElementDeclaration,
  CustomElementDeclaration,
  LitElementExport,
  PackageJson,
  ModuleWithLitElementDeclarations,
  DeprecatableDescribed,
  FunctionDeclaration,
} from './lib/model.js';

export type {AbsolutePath, PackagePath} from './lib/paths.js';

// Any non-type exports below must be safe to use on objects between multiple
// versions of the analyzer library
export {getImportsStringForReferences} from './lib/model.js';
