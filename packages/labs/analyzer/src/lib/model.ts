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
  readonly name: string | undefined;
  readonly node: ts.ClassDeclaration;

  constructor(init: ClassDeclarationInit) {
    this.name = init.name;
    this.node = init.node;
  }
}

interface LitElementDeclarationInit extends ClassDeclarationInit {
  tagname: string | undefined;
}

export class LitElementDeclaration extends ClassDeclaration {
  readonly isLitElement = true;

  /**
   * The element's tag name, if one is associated with this class declaration,
   * such as with a `@customElement()` decorator or `customElements.define()`
   * call int he same module.
   *
   * This is undefined if the element has no associated custom element
   * registration in the same module. This class might be intended for use as a
   * base class or with scoped custom element registries.
   */
  readonly tagname: string | undefined;

  constructor(init: LitElementDeclarationInit) {
    super(init);
    this.tagname = init.tagname;
  }
}
