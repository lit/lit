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

/**
 * Return type of `getLitElementModules`: contains a module and filtered list of
 * LitElementDeclarations contained within it.
 */
export type ModuleWithLitElementDeclarations = {
  module: Module;
  declarations: LitElementDeclaration[];
};

export interface PackageInfoInit {
  name: string;
  rootDir: AbsolutePath;
  packageJson: PackageJson;
}

export class PackageInfo {
  readonly name: string;
  readonly rootDir: AbsolutePath;
  readonly packageJson: PackageJson;

  constructor(init: PackageInfoInit) {
    this.name = init.name;
    this.rootDir = init.rootDir;
    this.packageJson = init.packageJson;
  }
}

export interface PackageInit extends PackageInfo {
  modules: ReadonlyArray<Module>;
}

export class Package extends PackageInfo {
  readonly modules: ReadonlyArray<Module>;

  constructor(init: PackageInit) {
    super(init);
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

export type LocalNameOrReference = string | Reference;
export type ExportMap = Map<string, LocalNameOrReference>;
export type DeclarationMap = Map<string, Declaration | (() => Declaration)>;

export interface ModuleInit {
  sourceFile: ts.SourceFile;
  sourcePath: PackagePath;
  jsPath: PackagePath;
  packageJson: PackageJson;
  declarationMap: DeclarationMap;
  exportMap: ExportMap;
  dependencies: Set<AbsolutePath>;
  finalizeExports?: () => void;
}

export interface ModuleInfo {
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
  /**
   * A map of names to models or model factories for all Declarations in this module.
   */
  private readonly _declarationMap: DeclarationMap;
  /**
   * Private storage for all declarations within this module, memoized
   * in `get declarations()` getter.
   */
  private _declarations: Declaration[] | undefined = undefined;
  /**
   * A set of all dependencies of this module, as module absolute paths.
   */
  readonly dependencies: Set<AbsolutePath>;
  /**
   * The package.json contents for the package containing this module.
   */
  readonly packageJson: PackageJson;
  /**
   * A map of exported names to local declaration names or References, in
   * the case of re-exported symbols.
   */
  private readonly _exportMap: ExportMap;
  /**
   * A list of module paths for all wildcard re-exports
   */
  private _finalizeExports: (() => void) | undefined;

  constructor(init: ModuleInit) {
    this.sourceFile = init.sourceFile;
    this.sourcePath = init.sourcePath;
    this.jsPath = init.jsPath;
    this.packageJson = init.packageJson;
    this._declarationMap = init.declarationMap;
    this.dependencies = init.dependencies;
    this._exportMap = init.exportMap;
    this._finalizeExports = init.finalizeExports;
  }

  /**
   * Ensures the list of exports includes the names of all reexports
   * from other modules.
   */
  private _ensureExportsFinalized() {
    if (this._finalizeExports !== undefined) {
      this._finalizeExports();
      this._finalizeExports = undefined;
    }
  }

  /**
   * Returns names of all exported declarations.
   */
  get exportNames() {
    this._ensureExportsFinalized();
    return Array.from(this._exportMap.keys());
  }

  /**
   * Given an exported symbol name, returns a Declaration if it was
   * defined in this module, or a Reference if it was imported from
   * another module.
   */
  getExport(name: string): Declaration | Reference {
    this._ensureExportsFinalized();
    const exp = this._exportMap.get(name);
    if (exp === undefined) {
      throw new Error(
        `Module ${this.sourcePath} did not contain an export named ${name}`
      );
    } else if (exp instanceof Reference) {
      return exp;
    } else {
      return this.getDeclaration(exp);
    }
  }

  /**
   * Return Reference for given export name.
   *
   * For references to local declarations, the module will be undefined.
   * For re-exports, the Reference will point to a package & module.
   */
  getExportReference(name: string): Reference {
    const exp = this.getExport(name);
    if (exp instanceof Declaration) {
      return new Reference({name: exp.name, dereference: () => exp});
    } else {
      return exp;
    }
  }

  /**
   * Given an exported symbol name, returns the concrete Declaration
   * for that symbol, following it through any re-exports.
   */
  getResolvedExport(name: string): Declaration {
    let exp = this.getExport(name);
    while (exp instanceof Reference) {
      exp = exp.dereference();
    }
    return exp as Declaration;
  }

  /**
   * Returns a `Declaration` model for the given name in top-level module scope.
   *
   * Note, the name is local to the module, and the declaration may be exported
   * from with a different name. The declaration is always concrete, and will
   * never be a `Reference`.
   */
  getDeclaration(name: string): Declaration {
    let dec = this._declarationMap.get(name);
    if (dec === undefined) {
      throw new Error(
        `Module ${this.sourcePath} did not contain a declaration named ${name}`
      );
    }
    // Overwrite a factory with its output (a `Declaration` model) on first
    // request
    if (typeof dec === 'function') {
      this._declarationMap.set(name, (dec = dec()));
    }
    return dec;
  }

  /**
   * Returns a list of all Declarations locally defined in this module.
   */
  get declarations() {
    return (this._declarations ??= Array.from(this._declarationMap.keys()).map(
      (name) => this.getDeclaration(name)
    ));
  }

  /**
   * Returns all custom elements registered in this module.
   */
  getCustomElementExports(): LitElementExport[] {
    return this.declarations.filter(
      (d) => d.isLitElementDeclaration() && d.tagname !== undefined
    ) as LitElementExport[];
  }
}

interface DeclarationInit extends NodeJSDocInfo {
  name: string;
}

export abstract class Declaration {
  readonly name: string;
  readonly description?: string | undefined;
  readonly summary?: string | undefined;
  readonly deprecated?: string | boolean | undefined;
  constructor(init: DeclarationInit) {
    this.name = init.name;
    this.description = init.description;
    this.summary = init.summary;
    this.deprecated = init.deprecated;
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
  node: ts.VariableDeclaration | ts.ExportAssignment;
  type: Type | undefined;
}

export class VariableDeclaration extends Declaration {
  readonly node: ts.VariableDeclaration | ts.ExportAssignment;
  readonly type: Type | undefined;
  constructor(init: VariableDeclarationInit) {
    super(init);
    this.node = init.node;
    this.type = init.type;
  }
}

export type ClassHeritage = {
  mixins: Reference[];
  superClass: Reference | undefined;
};

export interface ClassDeclarationInit extends DeclarationInit {
  node: ts.ClassDeclaration;
  getHeritage: () => ClassHeritage;
}

export class ClassDeclaration extends Declaration {
  readonly node: ts.ClassDeclaration;
  private _getHeritage: () => ClassHeritage;
  private _heritage: ClassHeritage | undefined = undefined;

  constructor(init: ClassDeclarationInit) {
    super(init);
    this.node = init.node;
    this._getHeritage = init.getHeritage;
  }

  get heritage(): ClassHeritage {
    return (this._heritage ??= this._getHeritage());
  }
}

export interface NamedJSDocInfo {
  name: string;
  description?: string | undefined;
  summary?: string | undefined;
}

export interface NodeJSDocInfo {
  description?: string | undefined;
  summary?: string | undefined;
  deprecated?: string | boolean | undefined;
}

interface LitElementDeclarationInit extends ClassDeclarationInit {
  tagname: string | undefined;
  reactiveProperties: Map<string, ReactiveProperty>;
  events: Map<string, Event>;
  slots: Map<string, NamedJSDocInfo>;
  cssProperties: Map<string, NamedJSDocInfo>;
  cssParts: Map<string, NamedJSDocInfo>;
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
  readonly slots: Map<string, NamedJSDocInfo>;
  readonly cssProperties: Map<string, NamedJSDocInfo>;
  readonly cssParts: Map<string, NamedJSDocInfo>;

  constructor(init: LitElementDeclarationInit) {
    super(init);
    this.tagname = init.tagname;
    this.reactiveProperties = init.reactiveProperties;
    this.events = init.events;
    this.slots = init.slots;
    this.cssProperties = init.cssProperties;
    this.cssParts = init.cssParts;
  }
}

/**
 * A LitElementDeclaration that has been globally registered with a tagname.
 */
export interface LitElementExport extends LitElementDeclaration {
  tagname: string;
}

export interface ReactiveProperty {
  name: string;

  type: Type | undefined;

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
  dereference?: () => Declaration | undefined;
}

export class Reference {
  readonly name: string;
  readonly package: string | undefined;
  readonly module: string | undefined;
  readonly isGlobal: boolean;
  private readonly _dereference: () => Declaration | undefined;
  private _model: Declaration | undefined = undefined;
  constructor(init: ReferenceInit) {
    this.name = init.name;
    this.package = init.package;
    this.module = init.module;
    this.isGlobal = init.isGlobal ?? false;
    this._dereference = init.dereference ?? (() => undefined);
  }

  get moduleSpecifier() {
    const separator = this.package && this.module ? '/' : '';
    return this.isGlobal
      ? undefined
      : (this.package || '') + separator + (this.module || '');
  }

  /**
   * Returns the Declaration model that this reference points to, optionally
   * validating (and casting) it to be of a given type by passing a model
   * constructor.
   */
  dereference<T extends Declaration>(type?: Constructor<T> | undefined): T {
    const model = (this._model ??= this._dereference());
    if (type !== undefined && model !== undefined && !(model instanceof type)) {
      throw new Error(
        `Expected reference to ${this.name} in module ${this.moduleSpecifier} to be of type ${type.name}`
      );
    }
    return model as T;
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
  moduleCache: Map<AbsolutePath, Module>;
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
    | 'join'
    | 'relative'
    | 'dirname'
    | 'basename'
    | 'dirname'
    | 'parse'
    | 'normalize'
    | 'isAbsolute'
  >;
}

/**
 * The name, model factory, and export information about a given declaration.
 */
export type DeclarationInfo = {
  name: string;
  factory: () => Declaration;
  isExport?: boolean;
};
