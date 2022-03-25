/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import ts from 'typescript';

export class Package {
  modules: ReadonlyArray<Module>;

  constructor(modules: ReadonlyArray<Module>) {
    this.modules = modules;
  }
}

export class Module {
  sourceFile: ts.SourceFile;

  constructor(sourceFile: ts.SourceFile) {
    this.sourceFile = sourceFile;
  }
}
