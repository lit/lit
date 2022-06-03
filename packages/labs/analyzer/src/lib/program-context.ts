/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import ts from 'typescript';
import {DiagnosticsError, createDiagnostic} from './errors.js';
import * as typedoc from 'typedoc';
import path from 'path';
import fs from 'fs';
import {Module, PackageJson, Type, Reference} from './model.js';

type FileCache = ts.MapLike<{version: 0; content?: ts.IScriptSnapshot}>;

const createServiceHost = (
  commandLine: ts.ParsedCommandLine,
  cache: FileCache
): ts.LanguageServiceHost => {
  for (const fileName of commandLine.fileNames) {
    cache[fileName] = {version: 0};
  }
  return {
    getScriptFileNames: () => commandLine.fileNames,
    getScriptVersion: (fileName) => cache[fileName]?.version.toString(),
    getScriptSnapshot: (fileName) => {
      if (cache[fileName]?.version > 0) {
        return cache[fileName].content;
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
};

/**
 * Utility class that stores context about the current program under
 * analysis and helpers for generating Type objects.
 */
export class ProgramContext {
  readonly service: ts.LanguageService;
  readonly package: string;
  program!: ts.Program;
  checker!: ts.TypeChecker;
  private _typedocContext!: typedoc.Context;
  private _typedocConverter!: typedoc.Converter;

  currentModule: Module | undefined = undefined;

  fileCache: FileCache = {};

  constructor(commandLine: ts.ParsedCommandLine, packageJson: PackageJson) {
    const serviceHost = createServiceHost(commandLine, this.fileCache);
    const services = ts.createLanguageService(
      serviceHost,
      ts.createDocumentRegistry()
    );
    this.service = services;
    this.package = packageJson.name!;
    this.invalidate();
    const diagnostics = this.program.getSemanticDiagnostics();
    if (diagnostics.length > 0) {
      throw new DiagnosticsError(
        diagnostics,
        `Error analyzing package '${this.package}': Please fix errors first`
      );
    }
    this.extractJsdocTypes();
  }

  /**
   * Re-initialize the program, checker, and typedoc converter (causes the file
   * cache versions to be diffed, and changed files to be re-parsed/checked)
   */
  private invalidate() {
    this.program = this.service.getProgram()!;
    this.checker = this.program.getTypeChecker();
    this._typedocConverter = new typedoc.Converter(new typedoc.Application());
    this._typedocContext = new typedoc.Context(
      this._typedocConverter,
      [this.program],
      new typedoc.ProjectReflection('')
    );
    this._typedocContext.setActiveProgram(this.program);
  }

  /**
   * Update the file cache with the new text of one or more modified source
   * file, and re-parse/check them
   */
  updateFiles(sourceFiles: ts.SourceFile[]) {
    for (const sourceFile of sourceFiles) {
      const printer = ts.createPrinter({newLine: ts.NewLineKind.LineFeed});
      this.fileCache[sourceFile.fileName].content =
        ts.ScriptSnapshot.fromString(printer.printFile(sourceFile));
      this.fileCache[sourceFile.fileName].version++;
    }
    this.invalidate();
  }

  /**
   * Associates jsdoc tags with any string `{Type}`s in them
   */
  private jsdocTypeMap = new WeakMap<ts.JSDocTag, ts.Type>();

  /**
   * Generates ts.Type nodes for types specified as {Type} strings in the
   * comment text of custom jsdoc tags listed in the `customJSDocTypeTags`
   * allowlist.
   *
   * Achieved by doing a pass over the AST, finding all such jsdoc tags and
   * extracting the type text, generating dummy `let __$$customJsDOCType52:
   * SomeType;` statements, finding those and extracting their type, and then
   * re-associating them with the jsdoc comments via a WeakMap.  The original
   * source is restored (and re-parsed/checked) prior to returning.
   *
   * This should be run once prior to analysis. The type for a jsdoc comment can
   * then be looked up via `getTypeForJSDocTag`.
   */
  private extractJsdocTypes() {
    const origSourceFiles = [];
    const modifiedSourceFiles = [];
    const tags: ts.JSDocTag[] = [];
    for (const fileName of this.program.getRootFileNames()) {
      const inferStatements: string[] = [];
      const sourceFile = this.program.getSourceFile(path.normalize(fileName))!;
      // Find JSDoc tags that contain string types and generate dummy variable
      // declarations using their types
      visitCustomJSDocTypeTags(
        sourceFile,
        (tag: ts.JSDocTag, typeString: string) => {
          tags.push(tag);
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
        origSourceFiles.push(sourceFile);
        modifiedSourceFiles.push(newSourceFile);
      }
    }
    if (modifiedSourceFiles.length > 0) {
      // If we had source files with type tags, update the language service
      // with the modified files
      this.updateFiles(modifiedSourceFiles);
      const origErrors = this.program.getSemanticDiagnostics();
      if (origErrors.length) {
        const retargetedErrors: ts.Diagnostic[] = [];
        for (const error of origErrors) {
          const tag = getTagForError(error, tags);
          if (tag) {
            retargetedErrors.push(
              createDiagnostic(tag, error.messageText as string)
            );
          } else {
            throw new Error(
              'Internal error: Could not associate inferred type error with original jsdoc tag.'
            );
          }
        }
        throw new DiagnosticsError(
          retargetedErrors,
          `Error analyzing package '${this.package}': Please fix errors first`
        );
      }
      // Find the inferred types and store them in a list
      const types: ts.Type[] = [];
      for (const modifiedSourceFile of modifiedSourceFiles) {
        const sourceFile = this.program.getSourceFile(
          modifiedSourceFile.fileName
        )!;
        visitCustomJSDocTypeInferredTypes(
          sourceFile,
          (node: ts.VariableDeclaration) => {
            types.push(this.checker.getTypeAtLocation(node));
          }
        );
      }
      // Restore the original source files
      this.updateFiles(origSourceFiles);
      // Find typed JSDoc tags again and associate them with their type
      for (const origSourceFile of origSourceFiles) {
        const sourceFile = this.program.getSourceFile(origSourceFile.fileName)!;
        let tagIndex = 0;
        visitCustomJSDocTypeTags(sourceFile, (tag: ts.JSDocTag) => {
          const type = types[tagIndex++];
          this.jsdocTypeMap.set(tag, type);
        });
      }
    }
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
   * Returns an analyzer `Type` object for the given jsDoc tag.
   *
   * Note, the tag type must
   */
  getTypeForJSDocTag(tag: ts.JSDocTag): Type {
    if (!customJSDocTypeTags.has(tag.tagName.text)) {
      throw new DiagnosticsError(
        tag,
        `Internal error: '${tag.tagName.text}' is not included in customJSDocTypeTags.`
      );
    }
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
          });
        }
      } else {
        // Declared in this file: use the current package and module
        return new Reference({
          name,
          package: this.package,
          module: this.currentModule.jsPath,
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
const visitCustomJSDocTypeInferredTypes = (
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
    visitCustomJSDocTypeInferredTypes(child, callback)
  );
};

const getTagForError = (error: ts.Diagnostic, tags: ts.JSDocTag[]) => {
  if (error.file === undefined) {
    return;
  }
  const beforeError = error.file.text.slice(0, error.start);
  const symbolStart = beforeError.lastIndexOf(customJSDocTypeInferPrefix);
  const index = parseInt(
    beforeError.slice(symbolStart + customJSDocTypeInferPrefix.length),
    10
  );
  return tags[index];
};
