/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import ts from 'typescript';
import {AbsolutePath, PackagePath} from './paths.js';

import {IPackageJson as PackageJson} from 'package-json-type';
export {PackageJson};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Constructor<T> = new (...args: any[]) => T;

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
  private _modulesByPackagePath: Map<PackagePath, Module> | undefined;

  constructor(init: PackageInit) {
    this.rootDir = init.rootDir;
    this.packageJson = init.packageJson;
    this.tsConfig = init.tsConfig;
    this.modules = init.modules;
  }

  getModule(path: PackagePath): Module {
    this._modulesByPackagePath ??= new Map(
      this.modules.map((m) => [m.jsPath, m])
    );
    const module = this._modulesByPackagePath.get(path);
    if (module === undefined) {
      throw new Error(
        `No module with path ${path} in package ${
          this.packageJson.name ?? this.rootDir
        }`
      );
    }
    return module;
  }
}

export interface ModuleInit {
  sourceFile: ts.SourceFile;
  sourcePath: PackagePath;
  jsPath: PackagePath;
  declarations?: Declaration[];
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
  readonly declarations: Array<Declaration>;
  readonly dependencies = new Set<string>();

  private _exportsByName: Map<string, Declaration> | undefined;

  constructor(init: ModuleInit) {
    this.sourceFile = init.sourceFile;
    this.sourcePath = init.sourcePath;
    this.jsPath = init.jsPath;
    this.declarations = init.declarations ?? [];
  }

  getExport<T extends Declaration>(name: string, type: Constructor<T>): T {
    this._exportsByName ??= new Map(this.declarations.map((d) => [d.name!, d]));
    const declaration = this._exportsByName!.get(name);
    if (declaration === undefined) {
      throw new Error(`Module ${this.jsPath} has no export named ${name}`);
    }
    if (!(declaration instanceof type)) {
      throw new Error(
        `Export ${name} from module ${this.jsPath} was of type ${declaration.constructor.name}; expected ${type.name}`
      );
    }
    return declaration;
  }
}

export type Declaration =
  | VariableDeclaration
  | FunctionDeclaration
  | ClassDeclaration
  | MixinDeclaration;

export interface VariableDeclarationInit {
  name: string;
  node: ts.VariableDeclaration;
  getType: () => Type | undefined;
}

export class VariableDeclaration {
  readonly name: string;
  readonly node: ts.VariableDeclaration;
  private _getType: () => Type | undefined;
  private _type: Type | undefined;

  constructor(init: VariableDeclarationInit) {
    this.name = init.name;
    this.node = init.node;
    this._getType = init.getType;
  }

  get type(): Type | undefined {
    return (this._type ??= this._getType());
  }
}

export interface FunctionDeclarationInit {
  name: string;
  node: ts.FunctionLikeDeclaration;
}

export class FunctionDeclaration {
  readonly name: string;
  readonly node: ts.FunctionLikeDeclaration;
  constructor(init: FunctionDeclarationInit) {
    this.name = init.name;
    this.node = init.node;
  }
}

export type ClassHeritage = {
  mixins: MixinDeclaration[];
  superClass: ClassDeclaration | undefined;
};

export interface ClassDeclarationInit {
  name: string | undefined;
  node: ts.ClassLikeDeclarationBase;
  getHeritage: () => ClassHeritage;
}

export class ClassDeclaration {
  readonly name: string | undefined;
  readonly node: ts.ClassLikeDeclarationBase;
  private _getHeritage: () => ClassHeritage;
  private _heritage: ClassHeritage | undefined;

  constructor(init: ClassDeclarationInit) {
    this.name = init.name;
    this.node = init.node;
    this._getHeritage = init.getHeritage;
  }

  get heritage(): ClassHeritage {
    return (this._heritage ??= this._getHeritage());
  }
}

export interface MixinDeclarationInit extends FunctionDeclarationInit {
  node: ts.FunctionLikeDeclaration;
  classDeclaration: ClassDeclaration;
  superClassArgIdx: number;
  // superClassConstraintType: ts.Type | undefined;
}

export class MixinDeclaration extends FunctionDeclaration {
  readonly classDeclaration: ClassDeclaration;
  readonly superClassArgIdx: number;
  // readonly superClassConstraintType: ts.Type | undefined;
  constructor(init: MixinDeclarationInit) {
    super(init);
    this.classDeclaration = init.classDeclaration;
    this.superClassArgIdx = init.superClassArgIdx;
    // this.superClassConstraintType = init.superClassConstraintType;
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

export interface ReactivePropertyInit {
  name: string;
  node: ts.PropertyDeclaration;

  getType: () => Type | undefined;

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

export class ReactiveProperty {
  readonly name: string;
  readonly node: ts.PropertyDeclaration;
  readonly reflect: boolean;
  private _getType: () => Type | undefined;
  private _type: Type | undefined;

  // TODO(justinfagnani): should we convert into attribute name?
  readonly attribute: boolean | string | undefined;

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

  constructor(init: ReactivePropertyInit) {
    this.name = init.name;
    this.node = init.node;
    this.reflect = init.reflect;
    this.attribute = init.attribute;
    this.typeOption = init.typeOption;
    this.converter = init.converter;
    this._getType = init.getType;
  }

  get type(): Type | undefined {
    return (this._type ??= this._getType());
  }
}

export interface EventInit {
  name: string;
  description: string | undefined;
  getType: () => Type | undefined;
}

export class Event {
  readonly name: string;
  readonly description: string | undefined;
  private _getType: () => Type | undefined;
  private _type: Type | undefined;

  constructor(init: EventInit) {
    this.name = init.name;
    this.description = init.description;
    this._getType = init.getType;
  }

  get type(): Type | undefined {
    return (this._type ??= this._getType());
  }
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

export interface Analyzer {
  readonly packageRoot: AbsolutePath;
  readonly commandLine: ts.ParsedCommandLine;
  readonly packageJson: PackageJson;
  readonly service: ts.LanguageService;
  program: ts.Program;
  checker: ts.TypeChecker;
  getTypeForJSDocTag(tag: ts.JSDocTag): Type | undefined;
  getTypeForNode(node: ts.Node): Type;
  getModelForIdentifier<T extends Declaration>(
    identifier: ts.Identifier,
    type: Constructor<T>
  ): T;
}
