/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import ts from 'typescript';
import {AbsolutePath, PackagePath} from './paths.js';
import {DiagnosticsError} from './errors.js';

import {IPackageJson as PackageJson} from 'package-json-type';
export {PackageJson};
import * as typedoc from 'typedoc';
import path from 'path';

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
  isGlobal: boolean;
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
    this.isGlobal = init.isGlobal;
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

  getImportStatementsForReferences() {
    return this.references
      .filter((ref) => !ref.isGlobal)
      .map(
        (ref) =>
          `import {${ref.name}} from '${ref.package}${
            ref.module ? '/' + ref.module : ''
          }';`
      )
      .join('\n');
  }
}

/**
 * Utility class that stores context about the current program under
 * analysis and helpers for generating Type objects.
 */
export class ProgramContext {
  readonly program: ts.Program;
  readonly checker: ts.TypeChecker;
  readonly package: string;
  private readonly _typedocContext: typedoc.Context;
  private readonly _typedocConverter: typedoc.Converter;

  currentModule: Module | undefined = undefined;

  constructor(program: ts.Program, packageName: string) {
    this.program = program;
    this.checker = program.getTypeChecker();
    this.package = packageName;
    this._typedocConverter = new typedoc.Converter(new typedoc.Application());
    this._typedocContext = new typedoc.Context(
      this._typedocConverter,
      [this.program],
      new typedoc.ProjectReflection('')
    );
    this._typedocContext.setActiveProgram(this.program);
  }

  /**
   * Returns a ts.Symbol for a name in scope at a given location in the AST.
   * TODO(kschaaf): There are ~1748 symbols in scope of a typical hello world,
   * due to DOM globals. Perf might become an issue here.
   */
  getSymbolForName(name: string, location: ts.Node): ts.Symbol | undefined {
    return this.checker
      .getSymbolsInScope(
        location,
        (ts.SymbolFlags as unknown as {All: number}).All
      )
      .filter((s) => s.name === name)[0];
  }

  /**
   * Returns an analyzer `Type` object for the given constructor name
   * in scope at a given location in the AST.
   *
   * `ctorName` can either refer to a class declaration or the instance
   * interface for one (since built-in DOM classes are often defined
   * as a legacy class using an interface)
   */
  getTypeForConstructorName(ctorName: string, location: ts.Node): Type {
    const symbol = this.getSymbolForName(ctorName, location);
    if (symbol === undefined) {
      throw new DiagnosticsError(
        location,
        `Symbol '${ctorName}' reference could not be found`
      );
    }
    const declaration = symbol.declarations?.[0];
    if (declaration === undefined) {
      throw new DiagnosticsError(
        location,
        `Declaration for symbol '${ctorName}' could not be found`
      );
    }
    const type = this.convertType(
      this.checker.getTypeOfSymbolAtLocation(symbol, location),
      location
    );
    // Since we're starting from a constructor name, we can just use that as the
    // type text, since that will be the instance type. The actual inferred type
    // of a constructor symbol might be `typeof SomeClass` or even `{new(): ...,
    // prototype: ...}` for builtins; however, we just care about the instance
    // type, which is just going to be the constructor name. TODO(kschaaf) note
    // that the `type` ts.Type will still point to the constructor, not the
    // InstanceType of the constructor; do we care?
    type.text = ctorName;
    return type;
  }

  /**
   * Returns an analyzer `Type` object for the given AST node.
   */
  getTypeForNode(node: ts.Node): Type {
    // Since getTypeAtLocation will return `any` for an untyped node, to support
    // jsdoc @type for JS (TBD), we look at the jsdoc type first.
    const jsdocType = ts.getJSDocType(node);
    return this.convertType(
      jsdocType
        ? this.checker.getTypeFromTypeNode(jsdocType)
        : this.checker.getTypeAtLocation(node),
      node
    );
  }

  /**
   * Returns the module specifier for a declaration if it was imported,
   * or `undefined` if the declaration was not imported.
   */
  getImportModuleSpecifier(declaration: ts.Node): string | undefined {
    // TODO(kschaaf) support the various import syntaxes
    if (
      ts.isImportSpecifier(declaration) &&
      ts.isNamedImports(declaration.parent) &&
      ts.isImportClause(declaration.parent.parent) &&
      ts.isImportDeclaration(declaration.parent.parent.parent)
    ) {
      const module = declaration.parent.parent.parent.moduleSpecifier
        .getText()
        // Remove quotes
        .slice(1, -1);
      return module;
    }
    return undefined;
  }

  /**
   * Returns an analyzer `Reference` object for a named identifier at the given
   * AST location.
   *
   * If the symbol's declaration was imported, the Reference will be based on
   * the import's module specifier; otherwise the Reference will point to the
   * current module being analyzed.
   */
  getReferenceForSymbolName(name: string, location: ts.Node): Reference {
    const symbol = this.getSymbolForName(name, location);
    if (this.currentModule === undefined) {
      throw new Error(`Internal error: expected currentModule to be set`);
    }
    const declaration = symbol?.declarations?.[0];
    if (declaration === undefined) {
      throw new DiagnosticsError(
        location,
        `Could not find declaration for symbol '${name}'`
      );
    }
    if (declaration.getSourceFile() !== location.getSourceFile()) {
      // If the reference declaration doesn't exist in this module, it must have
      // been a global (whose declaration is in an ambient .d.ts file)
      return new Reference({
        name,
        isGlobal: true,
      });
    } else {
      const module = this.getImportModuleSpecifier(declaration);
      if (module) {
        // The symbol was imported; check whether it is package local or external
        if (module[0] === '.') {
          // Relative import from this package: use the current package and
          // module path relative to this module
          return new Reference({
            name,
            package: this.package,
            module: path.join(path.dirname(this.currentModule.jsPath), module),
            isGlobal: false,
          });
        } else {
          // External import: extract the npm package (taking care to respect
          // npm orgs) and module specifier (if any)
          const info = module.match(
            /^(?<package>(@\w+\/\w+)|\w+)\/?(?<module>.*)$/
          );
          if (!info || !info.groups) {
            throw new DiagnosticsError(
              declaration,
              `External npm package could not be parsed from module specifier '${module}'.`
            );
          }
          return new Reference({
            name,
            package: info.groups!.package,
            module: info.groups!.module,
            isGlobal: false,
          });
        }
      } else {
        // Declared in this file: use the current package and module
        return new Reference({
          name,
          package: this.package,
          module: this.currentModule.jsPath,
          isGlobal: false,
        });
      }
    }
  }

  /**
   * Converts a ts.Type into an analyzer Type object (which wraps
   * the ts.Type, but also provides analyzer Reference objects).
   */
  convertType(type: ts.Type, location: ts.Node): Type {
    let text = this.checker.typeToString(type);
    // Use typedoc to give us a visitor for type references used in this type to
    // generate our `Reference`s. Note that `typedoc.ReferenceType` is very
    // close to the info we want in `Reference`, but it unfortunately is not
    // sufficient to generate import specifiers. Thus, we just use its visitor
    // to identify the name of identifiers that require references, and then use
    // the TS API to figure out their module specifiers.
    let typeTree = this._typedocConverter.convertType(
      this._typedocContext,
      type
    );
    const references: Reference[] = [];
    // Fix inferred types for classes defined with `{new()..., prototype:...}`
    // (the built-in DOM classes are defined like this in lib.dom.d.ts)
    if (text.match(/new\s*\(/) && typeTree instanceof typedoc.ReflectionType) {
      const protoType = typeTree.declaration.children?.find(
        (dec) => dec.name === 'prototype'
      )?.type;
      if (protoType && protoType instanceof typedoc.ReferenceType) {
        typeTree = protoType;
        text = protoType.name;
      }
    }
    typeTree.visit(
      typedoc.makeRecursiveVisitor({
        reference: (ref: typedoc.ReferenceType) => {
          references.push(this.getReferenceForSymbolName(ref.name, location));
        },
      })
    );
    return new Type(type, text, references);
  }
}
