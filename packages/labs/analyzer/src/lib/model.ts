/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import ts from 'typescript';
import {AbsolutePath, PackagePath} from './paths.js';

import {IPackageJson as PackageJson} from 'package-json-type';
export {PackageJson};

export interface PackageInit {
  rootDir: AbsolutePath;
  packageJson: PackageJson;
  tsConfig: ts.ParsedCommandLine;
  modules: ReadonlyArray<Module>;
}

export class Package {
  readonly rootDir: AbsolutePath;
  readonly modules: ReadonlyArray<Module>;
  readonly tsConfig: ts.ParsedCommandLine;
  readonly packageJson: PackageJson;

  constructor(init: PackageInit) {
    this.rootDir = init.rootDir;
    this.packageJson = init.packageJson;
    this.tsConfig = init.tsConfig;
    this.modules = init.modules;
  }
}

export interface ModuleInit {
  sourceFile: ts.SourceFile;
  sourcePath: PackagePath;
  jsPath: PackagePath;
}

export class Module {
  /**
   * The TS AST node for the file
   */
  readonly sourceFile: ts.SourceFile;
  /**
   * The path to the source file for this module. In a TS project, this will be
   * a .ts file. In a JS project, this will be the same as `jsPath`.
   */
  readonly sourcePath: PackagePath;
  /**
   * The path to the javascript file for this module. In a TS project, this will
   * be the output location of the compiler for the given `sourcePath`. In a JS
   * project this will be the same as `sourcePath`.
   */
  readonly jsPath: PackagePath;
  readonly declarations: Array<Declaration> = [];

  constructor(init: ModuleInit) {
    this.sourceFile = init.sourceFile;
    this.sourcePath = init.sourcePath;
    this.jsPath = init.jsPath;
  }
}

export type Declaration = ClassDeclaration | VariableDeclaration;

export interface VariableDeclarationInit {
  name: string;
  node: ts.VariableDeclaration;
  type: Type | undefined;
}

export class VariableDeclaration {
  readonly name: string;
  readonly node: ts.VariableDeclaration;
  readonly type: Type | undefined;
  constructor(init: VariableDeclarationInit) {
    this.name = init.name;
    this.node = init.node;
    this.type = init.type;
  }
}

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
  reactiveProperties: Map<string, ReactiveProperty>;
  readonly events: Map<string, Event>;
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

  readonly reactiveProperties: Map<string, ReactiveProperty>;

  readonly events: Map<string, Event>;

  constructor(init: LitElementDeclarationInit) {
    super(init);
    this.tagname = init.tagname;
    this.reactiveProperties = init.reactiveProperties;
    this.events = init.events;
  }
}

export interface ReactiveProperty {
  name: string;
  node: ts.PropertyDeclaration;

  type: Type;

  reflect: boolean;

  // TODO(justinfagnani): should we convert into attribute name?
  attribute: boolean | string | undefined;

  /**
   * The test of the `type` property option.
   *
   * This is really only useful if the type is one of the well known types:
   * String, Number, or Boolean.
   */
  typeOption: string | undefined;

  /**
   * The Node for the `converter` option if present.
   *
   * This is mostly useful to know whether the `type` option can be interpreted
   * with the default semantics or not.
   */
  converter: ts.Node | undefined;

  // TODO(justinfagnani): hasChanged?
}

export interface Event {
  name: string;
  description: string | undefined;
  type: Type | undefined;
}

// TODO(justinfagnani): Move helpers into a Lit-specific module
export const isLitElementDeclaration = (
  dec: Declaration
): dec is LitElementDeclaration => {
  return (
    dec instanceof ClassDeclaration &&
    (dec as LitElementDeclaration).isLitElement
  );
};

export interface LitModule {
  module: Module;
  elements: LitElementDeclaration[];
}

export const getLitModules = (analysis: Package) => {
  const modules: LitModule[] = [];
  for (const module of analysis.modules) {
    const elements = module.declarations.filter(isLitElementDeclaration);
    if (elements.length > 0) {
      modules.push({
        module,
        elements,
      });
    }
  }
  return modules;
};

export interface ReferenceInit {
  name: string;
  package?: string;
  module?: string;
  isGlobal?: boolean;
}

export class Reference {
  readonly name: string;
  readonly package: string | undefined;
  readonly module: string | undefined;
  readonly isGlobal: boolean;
  constructor(init: ReferenceInit) {
    this.name = init.name;
    this.package = init.package;
    this.module = init.module;
    this.isGlobal = init.isGlobal ?? false;
  }

  get moduleSpecifier() {
    return this.isGlobal
      ? undefined
      : this.package! + (this.module ? '/' + this.module : '');
  }
}

export class Type {
  type: ts.Type;
  text: string;
  references: Reference[];

  constructor(type: ts.Type, text: string, references: Reference[]) {
    this.type = type;
    this.text = text;
    this.references = references;
  }
}

/**
 * Returns a deduped / coalesced string of import statements required to load
 * the given references.
 */
export const getImportsStringForReferences = (references: Reference[]) => {
  const modules = new Map<string, Set<string>>();
  for (const {moduleSpecifier, name, isGlobal} of references) {
    if (!isGlobal) {
      let namesForModule = modules.get(moduleSpecifier!);
      if (namesForModule === undefined) {
        modules.set(moduleSpecifier!, (namesForModule = new Set()));
      }
      namesForModule.add(name);
    }
  }
  return Array.from(modules)
    .map(
      ([moduleSpecifier, namesForModule]) =>
        `import {${Array.from(namesForModule).join(
          ', '
        )}} from '${moduleSpecifier}';`
    )
    .join('\n');
};
