/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

/**
 * @fileoverview
 *
 * Utilities for analyzing ES modules
 */

import type ts from 'typescript';
import {
  Module,
  AnalyzerInterface,
  PackageInfo,
  Declaration,
  DeclarationInfo,
  ExportMap,
  DeclarationMap,
  ModuleInfo,
  LocalNameOrReference,
} from '../model.js';
import {getClassDeclarationInfo} from './classes.js';
import {
  getExportAssignmentVariableDeclarationInfo,
  getVariableDeclarationInfo,
  getEnumDeclarationInfo,
} from './variables.js';
import {AbsolutePath, PackagePath, absoluteToPackage} from '../paths.js';
import {getPackageInfo} from './packages.js';
import {createDiagnostic} from '../errors.js';
import {
  getExportReferences,
  getImportReferenceForSpecifierExpression,
  getSpecifierString,
} from '../references.js';
import {parseModuleJSDocInfo} from './jsdoc.js';
import {getFunctionDeclarationInfo} from './functions.js';

export type TypeScript = typeof ts;

/**
 * Returns the sourcePath, jsPath, and package.json contents of the containing
 * package for the given module path.
 *
 * This is a minimal subset of module information needed for constructing a
 * Reference object for a module.
 */
export const getModuleInfo = (
  modulePath: AbsolutePath,
  analyzer: AnalyzerInterface,
  packageInfo: PackageInfo = getPackageInfo(modulePath, analyzer)
): ModuleInfo => {
  // The packageRoot for this module is needed for translating the source file
  // path to a package relative path, and the packageName is needed for
  // generating references to any symbols in this module.
  const {rootDir, packageJson} = packageInfo;
  const absJsPath = getJSPathFromSourcePath(
    modulePath as AbsolutePath,
    analyzer
  );
  const jsPath =
    absJsPath !== undefined
      ? absoluteToPackage(absJsPath, rootDir, analyzer.path.sep)
      : ('not/implemented' as PackagePath);
  const sourcePath = absoluteToPackage(
    analyzer.path.normalize(modulePath) as AbsolutePath,
    rootDir,
    analyzer.path.sep
  );
  return {
    jsPath,
    sourcePath,
    packageJson,
  };
};

/**
 * Returns an analyzer `Module` model for the given module path.
 */
export const getModule = (
  modulePath: AbsolutePath,
  analyzer: AnalyzerInterface,
  packageInfo: PackageInfo = getPackageInfo(modulePath, analyzer)
) => {
  const {typescript: ts} = analyzer;
  // Return cached module if we've parsed this sourceFile already and its
  // dependencies haven't changed
  const cachedModule = getAndValidateModuleFromCache(modulePath, analyzer);
  if (cachedModule !== undefined) {
    return cachedModule;
  }
  const sourceFile = analyzer.program.getSourceFile(
    analyzer.path.normalize(modulePath)
  );
  if (sourceFile === undefined) {
    throw new Error(`Program did not contain a source file for ${modulePath}`);
  }

  const dependencies = new Set<AbsolutePath>();
  const declarationMap: DeclarationMap = new Map<string, () => Declaration>();
  const exportMap: ExportMap = new Map<string, LocalNameOrReference>();
  const reexports: ts.Expression[] = [];
  const addDeclaration = (info: DeclarationInfo) => {
    const {name, node, factory, isExport} = info;
    if (declarationMap.has(name)) {
      analyzer.addDiagnostic(
        createDiagnostic({
          typescript: ts,
          node,
          message: `Duplicate declaration '${name}'`,
          category: ts.DiagnosticCategory.Error,
        })
      );
      return;
    }
    declarationMap.set(name, factory);
    if (isExport) {
      exportMap.set(name, name);
    }
  };

  // Find and add models for declarations in the module
  // TODO(kschaaf): Add Function and MixinDeclarations
  for (const statement of sourceFile.statements) {
    if (ts.isClassDeclaration(statement)) {
      const decl = getClassDeclarationInfo(statement, analyzer);
      if (decl !== undefined) {
        addDeclaration(decl);
      }
      // Ignore non-implementation signatures of overloaded functions by
      // checking for `statement.body`.
    } else if (ts.isFunctionDeclaration(statement) && statement.body) {
      const decl = getFunctionDeclarationInfo(statement, analyzer);
      if (decl !== undefined) {
        addDeclaration(decl);
      }
    } else if (ts.isVariableStatement(statement)) {
      getVariableDeclarationInfo(statement, analyzer).forEach(addDeclaration);
    } else if (ts.isEnumDeclaration(statement)) {
      addDeclaration(getEnumDeclarationInfo(statement, analyzer));
    } else if (ts.isExportDeclaration(statement) && !statement.isTypeOnly) {
      const {exportClause, moduleSpecifier} = statement;
      if (exportClause === undefined) {
        // Case: `export * from 'foo';` The `exportClause` is undefined for
        // wildcard exports. Add the re-exported module specifier to the
        // `reexports` list, and we will add references to the exportMap lazily
        // the first time exports are queried
        if (moduleSpecifier === undefined) {
          analyzer.addDiagnostic(
            createDiagnostic({
              typescript: ts,
              node: statement,
              message: `Unexpected syntax: expected a wildcard export to always have a module specifier.`,
            })
          );
        } else {
          reexports.push(moduleSpecifier);
        }
      } else {
        // Case: `export {...}` and `export {...} from '...'`
        // Add all of the exports in this export statement to the exportMap
        getExportReferences(exportClause, moduleSpecifier, analyzer).forEach(
          ({exportName, decNameOrRef}) =>
            exportMap.set(exportName, decNameOrRef)
        );
      }
    } else if (ts.isExportAssignment(statement)) {
      addDeclaration(
        getExportAssignmentVariableDeclarationInfo(statement, analyzer)
      );
    } else if (ts.isImportDeclaration(statement)) {
      const path = getPathForModuleSpecifierExpression(
        statement.moduleSpecifier,
        analyzer
      );
      if (path !== undefined) {
        dependencies.add(path);
      }
    }
  }
  // Construct module and save in cache
  const module = new Module({
    ...getModuleInfo(modulePath, analyzer, packageInfo),
    sourceFile,
    declarationMap,
    dependencies,
    exportMap,
    finalizeExports: () => finalizeExports(reexports, exportMap, analyzer),
    ...parseModuleJSDocInfo(sourceFile, analyzer),
  });
  analyzer.moduleCache.set(
    analyzer.path.normalize(sourceFile.fileName) as AbsolutePath,
    module
  );
  return module;
};

/**
 * For any re-exported modules (i.e. `export * from 'foo'`), add all of the
 * exported names of the reexported module to the given exportMap, with
 * References into that module.
 */
const finalizeExports = (
  reexportSpecifiers: ts.Expression[],
  exportMap: ExportMap,
  analyzer: AnalyzerInterface
) => {
  for (const moduleSpecifier of reexportSpecifiers) {
    const path = getPathForModuleSpecifierExpression(moduleSpecifier, analyzer);
    if (path === undefined) {
      continue;
    }
    const module = getModule(path, analyzer);
    for (const name of module.exportNames) {
      exportMap.set(
        name,
        getImportReferenceForSpecifierExpression(
          moduleSpecifier,
          name,
          analyzer
        )
      );
    }
  }
};

/**
 * Returns a cached Module model for the given module path if it and all of its
 * dependencies' models are still valid since the model was cached. If the
 * cached module is out-of-date and needs to be re-created, this method returns
 * undefined.
 */
const getAndValidateModuleFromCache = (
  modulePath: AbsolutePath,
  analyzer: AnalyzerInterface,
  seen = new Set<AbsolutePath>([modulePath])
): Module | undefined => {
  const module = analyzer.moduleCache.get(modulePath);
  // A cached module is only valid if the source file that was used has not
  // changed in the current program, and if all of its dependencies are still
  // valid
  if (module !== undefined) {
    if (
      module.sourceFile === analyzer.program.getSourceFile(modulePath) &&
      depsAreValid(module, analyzer, seen)
    ) {
      return module;
    }
    analyzer.moduleCache.delete(modulePath);
  }
  return undefined;
};

/**
 * Returns true if all dependencies of the module are still valid.
 */
const depsAreValid = (
  module: Module,
  analyzer: AnalyzerInterface,
  seen: Set<AbsolutePath>
): boolean =>
  Array.from(module.dependencies).every(
    (path) =>
      // `seen` is initialized only once, at the entry point for the initial
      // call to `getAndValidateModuleFromCache`, and modulePaths are only added
      // to `seen` at  the deepest part of the recursion, in `depIsValid`
      // because of that, we can be confident that a module path which was 'seen'
      // has already been validated by `depIsValid` and can be safely skipped here.
      seen.has(path) || depIsValid(path, analyzer, seen)
  );

/**
 * Returns true if the given dependency is valid, meaning that if it has a
 * cached model, the model is still valid. Dependencies that don't yet have a
 * cached model are considered valid.
 */
const depIsValid = (
  modulePath: AbsolutePath,
  analyzer: AnalyzerInterface,
  seen: Set<AbsolutePath>
) => {
  seen.add(modulePath);
  if (analyzer.moduleCache.has(modulePath)) {
    // If a dep has a model, it is valid only if its deps are valid
    return Boolean(getAndValidateModuleFromCache(modulePath, analyzer, seen));
  } else {
    // Deps that don't have a cached model are considered valid
    return true;
  }
};

/**
 * For a given source file, return its associated JS file.
 *
 * For a JS source file, these will be the same thing. For a TS file, we use the
 * TS API to determine where the associated JS will be output based on tsconfig
 * settings.
 */
const getJSPathFromSourcePath = (
  sourcePath: AbsolutePath,
  analyzer: AnalyzerInterface
) => {
  sourcePath = analyzer.path.normalize(sourcePath) as AbsolutePath;
  // If the source file was already JS, just return that
  if (sourcePath.endsWith('js')) {
    return sourcePath;
  }
  // TODO(kschaaf): If the source file was a declaration file, this means we're
  // likely getting information about an externally imported package that had
  // types. In this case, we'll need to update our logic to resolve the import
  // specifier to the JS path (in addition to the source file path that we do
  // today). Unfortunately, TS's specifier resolver always prefers a declaration
  // file, and due to type roots and other tsconfig fancies, it's not
  // straightforward to go from a declaration file to a source file. In order to
  // properly implement this we'll probably need to bring our own node module
  // resolver ala https://www.npmjs.com/package/resolve. That change should be
  // done along with the custom-elements.json manifest work.
  if (sourcePath.endsWith('.d.ts')) {
    return undefined;
  }
  // Use the TS API to determine where the associated JS will be output based
  // on tsconfig settings.
  const outputPath = analyzer.typescript
    .getOutputFileNames(analyzer.commandLine, sourcePath, false)
    .filter((f) => f.endsWith('.js'))[0];
  // TODO(kschaaf): this could happen if someone imported only a .d.ts file;
  // we might need to handle this differently
  if (outputPath === undefined) {
    throw new Error(`Could not determine output filename for '${sourcePath}'`);
  }
  // The filename appears to come out of the ts API with
  // unix separators; since sourcePath uses OS separators, normalize this so
  // that all our model paths are OS-native
  return analyzer.path.normalize(outputPath) as AbsolutePath;
};

/**
 * Resolves a module specifier expression node to an absolute path on disk.
 */
export const getPathForModuleSpecifierExpression = (
  specifierExpression: ts.Expression,
  analyzer: AnalyzerInterface
): AbsolutePath | undefined => {
  const specifier = getSpecifierString(specifierExpression);
  return getPathForModuleSpecifier(specifier, specifierExpression, analyzer);
};

/**
 * Resolve a module specifier to an absolute path on disk.
 */
export const getPathForModuleSpecifier = (
  specifier: string,
  location: ts.Node,
  analyzer: AnalyzerInterface
): AbsolutePath | undefined => {
  const resolvedPath = analyzer.typescript.resolveModuleName(
    specifier,
    location.getSourceFile().fileName,
    analyzer.commandLine.options,
    analyzer.fs
  ).resolvedModule?.resolvedFileName;
  if (resolvedPath === undefined) {
    analyzer.addDiagnostic(
      createDiagnostic({
        typescript: analyzer.typescript,
        node: location,
        message: `Could not resolve specifier ${specifier} to filesystem path.`,
        category: analyzer.typescript.DiagnosticCategory.Error,
      })
    );
    return undefined;
  }
  return analyzer.path.normalize(resolvedPath) as AbsolutePath;
};

/**
 * Returns the declaration for the named export of the given module path;
 * note that if the given module re-exported a declaration from another
 * module, references are followed to the concrete declaration, which is
 * returned.
 */
export const getResolvedExportFromSourcePath = (
  modulePath: AbsolutePath,
  name: string,
  analyzer: AnalyzerInterface
) => getModule(modulePath, analyzer)?.getResolvedExport(name);
