/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import ts from 'typescript';
import {PackagePath} from './paths.js';

export class Package {
  readonly modules: ReadonlyArray<Module>;

  constructor(modules: ReadonlyArray<Module>) {
    this.modules = modules;
  }
}

export interface ModuleInit {
  sourceFile: ts.SourceFile;
  path: PackagePath;
}

export class Module {
  readonly sourceFile: ts.SourceFile;
  readonly path: PackagePath;
  readonly declarations: Array<Declaration> = [];

  constructor(init: ModuleInit) {
    this.sourceFile = init.sourceFile;
    this.path = init.path;
  }
}

export type Declaration = ClassDeclaration;

export interface ClassDeclarationInit {
  name: string | undefined;
  node: ts.ClassDeclaration;
}

export class ClassDeclaration {
  name: string | undefined;
  node: ts.ClassDeclaration;

  constructor(init: ClassDeclarationInit) {
    this.name = init.name;
    this.node = init.node;
  }
}
