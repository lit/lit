/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
import ts from 'typescript';
export declare class Package {
  readonly modules: ReadonlyArray<Module>;
  constructor(modules: ReadonlyArray<Module>);
}
export declare class Module {
  readonly sourceFile: ts.SourceFile;
  constructor(sourceFile: ts.SourceFile);
}
//# sourceMappingURL=model.d.ts.map
