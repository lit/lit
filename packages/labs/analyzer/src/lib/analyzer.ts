/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import ts from 'typescript';
import {ClassDeclaration, Declaration, Package, PackageJson} from './model.js';
import {AbsolutePath, PackagePath} from './paths.js';
import * as fs from 'fs';
import * as path from 'path';
import {getModule} from './javascript/modules.js';
export {PackageJson};
import {DiagnosticsError} from './errors.js';
import {
  Analyzer as AnalyzerInterface,
  Module,
  Type,
  Reference,
  Constructor,
} from './model.js';
import {createRequire} from 'node:module';
import {parseType} from './parse-type.js';

const npmModule = /^(?<package>(@\w+\/\w+)|\w+)\/?(?<module>.*)$/;

type FileCache = Map<string, {version: 0; content?: ts.IScriptSnapshot}>;

// TODO(kschaaf): To be replaced by `getModelForIdentifier()` lazily importing
// an external package via custom-elements.json, and generating a
// custom-elements.json for `lit`
const defaultPackages = [
  new Package({
    rootDir: path.join(process.cwd(), 'node_modules', 'lit') as AbsolutePath,
    packageJson: {name: 'lit', main: 'index.js'},
    tsConfig: {options: {}, fileNames: [], errors: []},
    modules: [
      new Module({
        sourceFile: {} as ts.SourceFile,
        sourcePath: 'src/index.ts' as PackagePath,
        jsPath: 'index.js' as PackagePath,
        declarations: [
          new ClassDeclaration({
            name: 'LitElement',
            node: {} as ts.ClassDeclaration,
            getHeritage: () => ({mixins: [], superClass: undefined}),
          }),
        ],
      }),
    ],
  }),
];

/**
 * An analyzer for Lit npm packages
 */
export class Analyzer implements AnalyzerInterface {
  readonly packageRoot: AbsolutePath;
  readonly commandLine: ts.ParsedCommandLine;
  readonly packageJson: PackageJson;
  readonly service: ts.LanguageService;
  program!: ts.Program;
  checker!: ts.TypeChecker;

  packages: Map<string, Package>;
  modulesBySourceFilePath = new Map<AbsolutePath, Module>();
  modulesByJSFilePath = new Map<AbsolutePath, Module>();

  private fileCache: FileCache = new Map();

  /**
   * @param packageRoot The root directory of the package to analyze. Currently
   * this directory must have a tsconfig.json and package.json.
   */
  constructor(packageRoot: AbsolutePath) {
    this.packageRoot = packageRoot;

    // Initialize default packages
    this.packages = new Map();
    defaultPackages.forEach((p) => this.addPackage(p));

    // TODO(kschaaf): Consider moving the package.json and tsconfig.json
    // to analyzePackage() or move it to an async factory function that
    // passes these to the constructor as arguments.
    let packageJson;
    try {
      packageJson = JSON.parse(
        fs.readFileSync(path.join(packageRoot, 'package.json'), 'utf8')
      );
    } catch (e) {
      throw new Error(`package.json not found in ${packageRoot}`);
    }
    if (packageJson.name === undefined) {
      throw new Error(`package.json in ${packageRoot} did not have a name.`);
    }

    const configFileName = ts.findConfigFile(
      packageRoot,
      ts.sys.fileExists,
      'tsconfig.json'
    );
    if (configFileName === undefined) {
      // TODO: use a hard-coded tsconfig for JS projects.
      throw new Error(`tsconfig.json not found in ${packageRoot}`);
    }
    const configFile = ts.readConfigFile(configFileName, ts.sys.readFile);
    // Note `configFileName` is optional but must be set for
    // `getOutputFileNames` to work correctly; however, it must be relative to
    // `packageRoot`
    const commandLine = ts.parseJsonConfigFileContent(
      configFile.config /* json */,
      ts.sys /* host */,
      packageRoot /* basePath */,
      undefined /* existingOptions */,
      path.relative(packageRoot, configFileName) /* configFileName */
    );

    this.packageRoot = packageRoot;
    this.commandLine = commandLine;
    this.packageJson = packageJson;
    this.service = ts.createLanguageService(
      createServiceHost(commandLine, this.fileCache),
      ts.createDocumentRegistry()
    );
    this.program = this.service.getProgram()!;
    this.checker = this.program.getTypeChecker();
    const diagnostics = this.program.getSemanticDiagnostics();
    if (diagnostics.length > 0) {
      throw new DiagnosticsError(
        diagnostics,
        `Error analyzing package '${packageJson.name}': Please fix errors first`
      );
    }
  }

  private _isAnalyzingPackage = false;

  analyzePackage() {
    const rootFileNames = this.program.getRootFileNames();

    this._isAnalyzingPackage = true;
    const pkg = new Package({
      rootDir: this.packageRoot,
      modules: rootFileNames.map((fileName) =>
        getModule(this.program.getSourceFile(fileName)!, this)
      ),
      tsConfig: this.commandLine,
      packageJson: this.packageJson,
    });
    this.addPackage(pkg);
    this._isAnalyzingPackage = false;

    return pkg;
  }

  addPackage(pkg: Package) {
    this.packages.set(this.packageRoot, pkg);
    pkg.modules.forEach((mod) => {
      this.modulesBySourceFilePath.set(
        mod.sourceFile.fileName as AbsolutePath,
        mod
      );
      this.modulesByJSFilePath.set(
        path.join(pkg.rootDir, mod.jsPath) as AbsolutePath,
        mod
      );
    });
  }

  invalidateModule(fileName: AbsolutePath) {
    const module = this.modulesBySourceFilePath.get(fileName);
    if (module === undefined) {
      throw new Error(
        `Internal error: attempted to invalidate un-analyzed module: ${fileName}`
      );
    }
    this.modulesBySourceFilePath.delete(fileName);
    const require = createRequire(fileName);
    for (const depSpecifier of module.dependencies) {
      const depFileName = require.resolve(depSpecifier) as AbsolutePath;
      this.invalidateModule(depFileName);
    }
  }

  /**
   * Returns a ts.Symbol for a name in scope at a given location in the AST.
   * TODO(kschaaf): There are ~1748 symbols in scope of a typical hello world,
   * due to DOM globals. Perf might become an issue here. This is a reason to
   * look for a better Type visitor than typedoc:
   * https://github.com/lit/lit/issues/3001
   */
  private getSymbolForName(
    name: string,
    location: ts.Node
  ): ts.Symbol | undefined {
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
  getTypeForJSDocTag(tag: ts.JSDocTag): Type | undefined {
    const typeString =
      ts.isJSDocUnknownTag(tag) && typeof tag.comment === 'string'
        ? tag.comment?.match(/{(?<type>.*)}/)?.groups?.type
        : undefined;
    if (typeString !== undefined) {
      const typeNode = parseType(typeString);
      if (typeNode == undefined) {
        throw new DiagnosticsError(
          tag,
          `Internal error: failed to parse type from JSDoc comment.`
        );
      }
      const type = this.checker.getTypeFromTypeNode(typeNode);
      return new Type(
        type,
        typeString,
        this.getReferencesForTypeNode(typeNode, tag)
      );
    } else {
      return undefined;
    }
  }

  /**
   * Returns an analyzer `Type` object for the given AST node.
   */
  getTypeForNode(node: ts.Node): Type {
    // Since getTypeAtLocation will return `any` for an untyped node, to support
    // jsdoc @type for JS (TBD), we look at the jsdoc type first.
    const jsdocType = ts.getJSDocType(node);
    return this.getTypeForType(
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
  private getImportModuleSpecifier(declaration: ts.Node): string | undefined {
    // TODO(kschaaf) support the various import syntaxes, e.g. `import {foo as bar} from 'baz'`
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
   * Returns an analyzer `Reference` object for the given symbol.
   *
   * If the symbol's declaration was imported, the Reference will be based on
   * the import's module specifier; otherwise the Reference will point to the
   * current module being analyzed.
   */
  private getReferenceForSymbol(
    symbol: ts.Symbol,
    location: ts.Node
  ): Reference {
    const {name} = symbol;
    // TODO(kschaaf): Do we need to check other declarations? The assumption is
    // that even with multiple declarations (e.g. because of class interface +
    // constructor), the reference would point to the same location for all,
    // or else (in the case of e.g. namespace augmentation) it will be global
    // and not need a specific module specifier.
    const declaration = symbol?.declarations?.[0];
    if (declaration === undefined) {
      throw new DiagnosticsError(
        location,
        `Could not find declaration for symbol '${name}'`
      );
    }
    // There are 6 cases to cover:
    // 1. A global symbol that wasn't imported; in this case, its declaration
    //    will exist in a different source file than where we got the symbol
    //    from. For all other cases, the symbol's declaration node will be in
    //    this file, either as an ImportModuleSpecifier or a normal declaration.
    // 2. A symbol imported from a URL. The declaration will be an
    //    ImportModuleSpecifier and its module path will be parsable as a URL.
    // 3. A symbol imported from a relative file within this package. The
    //    declaration will be an ImportModuleSpecifier and its module path will
    //    start with a '.'
    // 4. A symbol imported from an absolute path. The declaration will be an
    //    ImportModuleSpecifier and its module path will start with a '/' This
    //    is a weird case to cover in the analyzer because it isn't portable.
    // 5. A symbol imported from an external package. The declaration will be an
    //    ImportModuleSpecifier and its module path will not start with a '.'
    // 6. A symbol declared in this file. The declaration will be one of many
    //    declaration types (just not an ImportModuleSpecifier).
    if (declaration.getSourceFile() !== location.getSourceFile()) {
      // If the reference declaration doesn't exist in this module, it must have
      // been a global (whose declaration is in an ambient .d.ts file)
      // TODO(kschaaf): We might want to further differentiate e.g. DOM globals
      // (that don't have any e.g. source to link to) from other ambient
      // declarations where we could at least point to a declaration file
      return new Reference({
        name,
        isGlobal: true,
      });
    } else {
      const module = this.getImportModuleSpecifier(declaration);
      if (module !== undefined) {
        // The symbol was imported; check whether it is a URL, absolute, package
        // local, or external
        try {
          new URL(module);
          // If this didn't throw, module was a valid URL; no package, just
          // use the URL as the module
          return new Reference({
            name,
            package: '',
            module: module,
          });
        } catch {
          if (module[0] === '.') {
            // Relative import from this package: use the current package and
            // module path relative to this module
            return new Reference({
              name,
              package: this.packageJson.name!,
              module: path.join(
                path.dirname(this.getModuleForNode(location).jsPath),
                module
              ),
            });
          } else if (module[0] === '/') {
            // Absolute import; no package, just use the entire path as the
            // module
            return new Reference({
              name,
              package: '',
              module: module,
            });
          } else {
            // External import: extract the npm package (taking care to respect
            // npm orgs) and module specifier (if any)
            const info = module.match(npmModule);
            if (!info || !info.groups) {
              throw new DiagnosticsError(
                declaration,
                `External npm package could not be parsed from module specifier '${module}'.`
              );
            }
            return new Reference({
              name,
              package: info.groups.package,
              module: info.groups.module || undefined,
            });
          }
        }
      } else {
        // Declared in this file: use the current package and module
        return new Reference({
          name,
          package: this.packageJson.name!,
          module: this.getModuleForNode(location).jsPath,
        });
      }
    }
  }

  /**
   * Converts a ts.Type into an analyzer Type object (which wraps
   * the ts.Type, but also provides analyzer Reference objects).
   */
  private getTypeForType(type: ts.Type, location: ts.Node): Type {
    // Ensure we treat inferred `foo = 'hi'` as 'string' not '"hi"'
    type = this.checker.getBaseTypeOfLiteralType(type);
    const text = this.checker.typeToString(type);
    const typeNode = this.checker.typeToTypeNode(
      type,
      location,
      ts.NodeBuilderFlags.IgnoreErrors
    );
    if (typeNode === undefined) {
      throw new DiagnosticsError(
        location,
        `Internal error: could not convert type to type node`
      );
    }
    return new Type(
      type,
      text,
      this.getReferencesForTypeNode(typeNode, location)
    );
  }

  private getReferencesForTypeNode(
    typeNode: ts.TypeNode,
    location: ts.Node
  ): Reference[] {
    const references: Reference[] = [];
    const visit = (node: ts.Node) => {
      if (ts.isTypeReferenceNode(node) || ts.isImportTypeNode(node)) {
        const name = getRootName(
          ts.isTypeReferenceNode(node) ? node.typeName : node.qualifier
        );
        // TODO(kschaaf): we'd like to just do
        // `checker.getSymbolAtLocation(node)` to get the symbol, but it appears
        // that nodes created with `checker.typeToTypeNode()` do not have
        // associated symbols, so we need to look up by name via
        // `checker.getSymbolsInScope()`
        const symbol = this.getSymbolForName(name, location);
        if (symbol === undefined) {
          throw new DiagnosticsError(
            location,
            `Could not get symbol for '${name}'.`
          );
        }
        references.push(this.getReferenceForSymbol(symbol, location));
      }
      ts.forEachChild(node, visit);
    };
    visit(typeNode);
    return references;
  }

  getModuleForNode(node: ts.Node): Module {
    if (this._isAnalyzingPackage) {
      throw new Error(
        'Internal error: getModuleForNode must not be called during package analysis'
      );
    }
    const fileName = node.getSourceFile().fileName as AbsolutePath;
    const module = this.modulesBySourceFilePath.get(fileName);
    if (module === undefined) {
      throw new Error(
        `Internal error: attempted to look up module model for source file '${fileName}' which has not been analyzed.`
      );
    }
    return module;
  }

  getModelForIdentifier<T extends Declaration>(
    identifier: ts.Identifier,
    type: Constructor<T>
  ): T {
    const symbol = this.checker.getSymbolAtLocation(identifier);
    if (symbol === undefined) {
      throw new DiagnosticsError(
        identifier,
        `Internal error: Could not get symbol for identifier.`
      );
    }
    const ref = this.getReferenceForSymbol(symbol, identifier);
    if (ref.isGlobal || ref.package === undefined) {
      throw new DiagnosticsError(
        identifier,
        `Not implemented: No model available for ${
          ref.isGlobal ? 'global' : 'absolute'
        } reference: ${ref.moduleSpecifier}`
      );
    }
    let module: Module | undefined;
    if (ref.package === this.packageJson.name) {
      module = this.packages
        .get(this.packageRoot)
        ?.getModule(ref.module as PackagePath);
    } else {
      const require = createRequire(identifier.getSourceFile().fileName);
      const resolvedFilePath = require.resolve(ref.moduleSpecifier!);
      module = this.modulesByJSFilePath.get(resolvedFilePath as AbsolutePath);
    }
    if (module === undefined) {
      throw new DiagnosticsError(
        identifier,
        `No analysis for module ${ref.moduleSpecifier}.`
      );
    }
    return module.getExport(ref.name, type);
  }
}

/**
 * Create a language service host that reads from the filesystem initially,
 * and supports updating individual source files in memory by updating its
 * content and version in the FileCache.
 */
const createServiceHost = (
  commandLine: ts.ParsedCommandLine,
  cache: FileCache
): ts.LanguageServiceHost => {
  return {
    getScriptFileNames: () => commandLine.fileNames,
    getScriptVersion: (fileName) =>
      cache.get(fileName)?.version.toString() ?? '-1',
    getScriptSnapshot: (fileName) => {
      let file = cache.get(fileName);
      if (file === undefined) {
        if (!fs.existsSync(fileName)) {
          return undefined;
        }
        file = {
          version: 0,
          content: ts.ScriptSnapshot.fromString(
            fs.readFileSync(fileName, 'utf-8')
          ),
        };
        cache.set(fileName, file);
      }
      return file.content;
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
 * Gets the left-most name of a (possibly qualified) identifier, i.e.
 * 'Foo' returns 'Foo', but 'ts.SyntaxKind' returns 'ts'. This is the
 * symbol that would need to be imported into a given scope.
 */
const getRootName = (
  name: ts.Identifier | ts.QualifiedName | undefined
): string => {
  if (name === undefined) {
    return '';
  }
  if (ts.isQualifiedName(name)) {
    return getRootName(name.left);
  } else {
    return name.text;
  }
};
