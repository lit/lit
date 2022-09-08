/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import ts from 'typescript';
import {AbsolutePath, PackagePath} from './paths.js';

import {IPackageJson as PackageJson} from 'package-json-type';
export {PackageJson};

/**
 * Return type of `getLitElementModules`: contains a module and filtered list of
 * LitElementDeclarations contained within it.
 */
export type ModuleWithLitElementDeclarations = {
  module: Module;
  declarations: LitElementDeclaration[];
};

export interface PackageInit {
  rootDir: AbsolutePath;
  modules: ReadonlyArray<Module>;
}

export class Package {
  readonly rootDir: AbsolutePath;
  readonly modules: ReadonlyArray<Module>;

  constructor(init: PackageInit) {
    this.rootDir = init.rootDir;
    this.modules = init.modules;
  }

  /**
   * Returns a list of modules in this package containing LitElement
   * declarations, along with the filtered list of LitElementDeclarartions.
   */
  getLitElementModules() {
    const modules: {module: Module; declarations: LitElementDeclaration[]}[] =
      [];
    for (const module of this.modules) {
      const declarations = module.declarations.filter((d) =>
        d.isLitElementDeclaration()
      ) as LitElementDeclaration[];
      if (declarations.length > 0) {
        modules.push({
          module,
          declarations,
        });
      }
    }
    return modules;
  }
}

export interface ModuleInit {
  sourceFile: ts.SourceFile;
  sourcePath: PackagePath;
  jsPath: PackagePath;
  packageJson: PackageJson;
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
  readonly packageJson: PackageJson;

  constructor(init: ModuleInit) {
    this.sourceFile = init.sourceFile;
    this.sourcePath = init.sourcePath;
    this.jsPath = init.jsPath;
    this.packageJson = init.packageJson;
  }
}

interface DeclarationInit {
  name: string;
}

export abstract class Declaration {
  name: string;
  constructor(init: DeclarationInit) {
    this.name = init.name;
  }
  isVariableDeclaration(): this is VariableDeclaration {
    return this instanceof VariableDeclaration;
  }
  isClassDeclaration(): this is ClassDeclaration {
    return this instanceof ClassDeclaration;
  }
  isLitElementDeclaration(): this is LitElementDeclaration {
    return this instanceof LitElementDeclaration;
  }
}

export interface VariableDeclarationInit extends DeclarationInit {
  node: ts.VariableDeclaration;
  type: Type | undefined;
}

export class VariableDeclaration extends Declaration {
  readonly node: ts.VariableDeclaration;
  readonly type: Type | undefined;
  constructor(init: VariableDeclarationInit) {
    super(init);
    this.node = init.node;
    this.type = init.type;
  }
}

export interface ClassDeclarationInit extends DeclarationInit {
  node: ts.ClassDeclaration;
}

export class ClassDeclaration extends Declaration {
  readonly node: ts.ClassDeclaration;

  constructor(init: ClassDeclarationInit) {
    super(init);
    this.node = init.node;
  }
}

interface LitElementDeclarationInit extends ClassDeclarationInit {
  tagname: string | undefined;
  reactiveProperties: Map<string, ReactiveProperty>;
  readonly events: Map<string, Event>;
}

export class LitElementDeclaration extends ClassDeclaration {
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

export interface LitModule {
  module: Module;
  elements: LitElementDeclaration[];
}

export interface ReferenceInit {
  name: string;
  package?: string | undefined;
  module?: string | undefined;
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
    const separator = this.package && this.module ? '/' : '';
    return this.isGlobal
      ? undefined
      : (this.package || '') + separator + (this.module || '');
  }
}

export interface TypeInit {
  type: ts.Type;
  text: string;
  getReferences: () => Reference[];
}

export class Type {
  type: ts.Type;
  text: string;
  private _getReferences: () => Reference[];
  private _references: Reference[] | undefined = undefined;

  constructor(init: TypeInit) {
    this.type = init.type;
    this.text = init.text;
    this._getReferences = init.getReferences;
  }

  get references() {
    return (this._references ??= this._getReferences());
  }
}

/**
 * Returns a deduped / coalesced string of import statements required to load
 * the given references.
 * TODO(kschaaf): Probably want to accept info about existing imports to dedupe
 * with.
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

export interface AnalyzerInterface {
  program: ts.Program;
  commandLine: ts.ParsedCommandLine;
  fs: Pick<
    ts.System,
    | 'readDirectory'
    | 'readFile'
    | 'realpath'
    | 'fileExists'
    | 'useCaseSensitiveFileNames'
  >;
  path: Pick<
    typeof import('path'),
    'join' | 'relative' | 'dirname' | 'basename' | 'dirname' | 'parse'
  >;
}
