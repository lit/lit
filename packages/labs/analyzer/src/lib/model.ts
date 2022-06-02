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
import fs from 'fs';

const customJSDocTypeTags = new Set(['fires']);
const visitCustomJSDocTypeTags = (
  node: ts.Node,
  callback: (tag: ts.JSDocTag, typeString: string) => void
) => {
  const jsDocTags = ts.getJSDocTags(node);
  if (jsDocTags?.length > 0) {
    for (const tag of jsDocTags) {
      if (
        ts.isJSDocUnknownTag(tag) &&
        customJSDocTypeTags.has(tag.tagName.text) &&
        typeof tag.comment === 'string'
      ) {
        const match = tag.comment.match(/{(?<type>.*)}/);
        if (match) {
          callback(tag, match.groups!.type);
        }
      }
    }
  }
  ts.forEachChild(node, (child: ts.Node) =>
    visitCustomJSDocTypeTags(child, callback)
  );
};

const customJSDocTypeInferPrefix = '__$$customJsDOCType';
const visitCustomJSDocTypeInferedTypes = (
  node: ts.Node,
  callback: (node: ts.VariableDeclaration) => void
) => {
  if (
    ts.isVariableDeclaration(node) &&
    ts.isIdentifier(node.name) &&
    node.name.text.startsWith(customJSDocTypeInferPrefix)
  ) {
    callback(node);
  }
  ts.forEachChild(node, (child) =>
    visitCustomJSDocTypeInferedTypes(child, callback)
  );
};

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
  readonly services: ts.LanguageService;
  readonly package: string;
  program!: ts.Program;
  checker!: ts.TypeChecker;
  private _typedocContext!: typedoc.Context;
  private _typedocConverter!: typedoc.Converter;

  currentModule: Module | undefined = undefined;

  files: ts.MapLike<{version: 0; content?: ts.IScriptSnapshot}> = {};

  constructor(commandLine: ts.ParsedCommandLine, packageJson: PackageJson) {
    for (const fileName of commandLine.fileNames) {
      this.files[fileName] = {version: 0};
    }
    const servicesHost: ts.LanguageServiceHost = {
      getScriptFileNames: () => commandLine.fileNames,
      getScriptVersion: (fileName) => this.files[fileName]?.version.toString(),
      getScriptSnapshot: (fileName) => {
        if (this.files[fileName]?.version > 0) {
          return this.files[fileName].content;
        } else {
          if (!fs.existsSync(fileName)) {
            return undefined;
          }
          return ts.ScriptSnapshot.fromString(
            fs.readFileSync(fileName).toString()
          );
        }
      },
      getCurrentDirectory: () => process.cwd(),
      getCompilationSettings: () => commandLine.options,
      getDefaultLibFileName: (options) => ts.getDefaultLibFilePath(options),
      fileExists: ts.sys.fileExists,
      readFile: ts.sys.readFile,
      readDirectory: ts.sys.readDirectory,
      directoryExists: ts.sys.directoryExists,
      getDirectories: ts.sys.getDirectories,
    };

    const services = ts.createLanguageService(
      servicesHost,
      ts.createDocumentRegistry()
    );
    this.services = services;
    this.package = packageJson.name!;
    this.invalidate();
    this.extractJsdocTypes();
  }

  private invalidate() {
    this.program = this.services.getProgram()!;
    this.checker = this.program.getTypeChecker();
    this._typedocConverter = new typedoc.Converter(new typedoc.Application());
    this._typedocContext = new typedoc.Context(
      this._typedocConverter,
      [this.program],
      new typedoc.ProjectReflection('')
    );
    this._typedocContext.setActiveProgram(this.program);
  }

  updateFiles(sourceFiles: ts.SourceFile[]) {
    for (const sourceFile of sourceFiles) {
      const printer = ts.createPrinter({newLine: ts.NewLineKind.LineFeed});
      this.files[sourceFile.fileName].content = ts.ScriptSnapshot.fromString(
        printer.printFile(sourceFile)
      );
      this.files[sourceFile.fileName].version++;
    }
    this.invalidate();
  }

  private jsdocTypeMap = new WeakMap<ts.JSDocTag, ts.Type>();

  private extractJsdocTypes() {
    const sourceFilesWithTags = [];
    for (const fileName of this.program.getRootFileNames()) {
      const inferStatements: string[] = [];
      const sourceFile = this.program.getSourceFile(path.normalize(fileName))!;
      // Find JSDoc tags that contain string types and generate dummy variable
      // declarations using their types
      visitCustomJSDocTypeTags(
        sourceFile,
        (_tag: ts.Node, typeString: string) => {
          inferStatements.push(
            `export let ${customJSDocTypeInferPrefix}${inferStatements.length}: ${typeString};\n`
          );
        }
      );
      // Update the source files with the dummy variable declarations (add to
      // end). We could try to keep these in the same lexical scope as the jsdoc
      // comment, but that's a lot more work, and given any references used also
      // need to be exported, seems unlikely they would use non-module scoped
      // symbols
      if (inferStatements.length > 0) {
        const inferStatementText = inferStatements.join('');
        const newSourceFile = sourceFile.update(
          sourceFile.text + inferStatementText,
          ts.createTextChangeRange(
            ts.createTextSpan(sourceFile.text.length, 0),
            inferStatementText.length
          )
        );
        sourceFilesWithTags.push(newSourceFile);
      }
    }
    if (sourceFilesWithTags.length > 0) {
      // If we had source files with type tags, update the language service
      // with the modified files
      this.updateFiles(sourceFilesWithTags);
      for (const oldSourceFile of sourceFilesWithTags) {
        const tags: ts.JSDocTag[] = [];
        const sourceFile = this.program.getSourceFile(oldSourceFile.fileName)!;
        // Find typed JSDoc tags in the new source file
        visitCustomJSDocTypeTags(sourceFile, (tag: ts.JSDocTag) => {
          tags.push(tag);
        });
        let tagIndex = 0;
        // Find the inferred types and associate them with their JSDoc tag
        // (note they are generated in the same order)
        visitCustomJSDocTypeInferedTypes(
          sourceFile,
          (node: ts.VariableDeclaration) => {
            const tag = tags[tagIndex++];
            const type = this.checker.getTypeAtLocation(node);
            this.jsdocTypeMap.set(tag, type);
          }
        );
      }
    }
    // TODO(kschaaf): As is, this leaves the generated declarations in the AST;
    // ideally we delete those so the downstream traversals don't have to ignore
    // them
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

  getTypeForJSDocTag(tag: ts.JSDocTag): Type {
    const type = this.jsdocTypeMap.get(tag);
    if (type === undefined) {
      throw new DiagnosticsError(
        tag,
        `Internal error: no type was pre-processed for this JSDoc tag`
      );
    }
    return this.convertType(type, tag);
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
