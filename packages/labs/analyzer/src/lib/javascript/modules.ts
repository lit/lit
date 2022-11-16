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

import ts from 'typescript';
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
import {getVariableDeclarationInfo} from './variables.js';
import {AbsolutePath, PackagePath, absoluteToPackage} from '../paths.js';
import {getPackageInfo} from './packages.js';
import {DiagnosticsError} from '../errors.js';
import {
  getExportReferences,
  getImportReferenceForSpecifierExpression,
  getSpecifierString,
} from '../references.js';

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
      ? absoluteToPackage(absJsPath, rootDir)
      : ('not/implemented' as PackagePath);
  const sourcePath = absoluteToPackage(
    analyzer.path.normalize(modulePath) as AbsolutePath,
    rootDir
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
    const {name, factory, isExport} = info;
    declarationMap.set(name, factory);
    if (isExport) {
      exportMap.set(name, name);
    }
  };

  // Find and add models for declarations in the module
  // TODO(kschaaf): Add Function and MixinDeclarations
  for (const statement of sourceFile.statements) {
    if (ts.isClassDeclaration(statement)) {
      addDeclaration(getClassDeclarationInfo(statement, analyzer));
    } else if (ts.isVariableStatement(statement)) {
      getVariableDeclarationInfo(statement, analyzer).forEach(addDeclaration);
    } else if (ts.isExportDeclaration(statement) && !statement.isTypeOnly) {
      const {exportClause, moduleSpecifier} = statement;
      if (exportClause === undefined) {
        // Case: `export * from 'foo';` The `exportClause` is undefined for
        // wildcard exports. Add the re-exported module specifier to the
        // `reexports` list, and we will add references to the exportMap lazily
        // the first time exports are queried
        if (moduleSpecifier === undefined) {
          throw new DiagnosticsError(
            statement,
            `Expected a wildcard export to have a module specifier.`
          );
        }
        reexports.push(moduleSpecifier);
      } else {
        // Case: `export {...}` and `export {...} from '...'`
        // Add all of the exports in this export statement to the exportMap
        getExportReferences(exportClause, moduleSpecifier, analyzer).forEach(
          ({exportName, decNameOrRef}) =>
            exportMap.set(exportName, decNameOrRef)
        );
      }
    } else if (ts.isImportDeclaration(statement)) {
      dependencies.add(
        getPathForModuleSpecifierExpression(statement.moduleSpecifier, analyzer)
      );
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
    const module = getModule(
      getPathForModuleSpecifierExpression(moduleSpecifier, analyzer),
      analyzer
    );
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
  analyzer: AnalyzerInterface
): Module | undefined => {
  const module = analyzer.moduleCache.get(modulePath);
  // A cached module is only valid if the source file that was used has not
  // changed in the current program, and if all of its dependencies are still
  // valid
  if (module !== undefined) {
    if (
      module.sourceFile === analyzer.program.getSourceFile(modulePath) &&
      depsAreValid(module, analyzer)
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
const depsAreValid = (module: Module, analyzer: AnalyzerInterface) =>
  Array.from(module.dependencies).every((path) => depIsValid(path, analyzer));

/**
 * Returns true if the given dependency is valid, meaning that if it has a
 * cached model, the model is still valid. Dependencies that don't yet have a
 * cached model are considered valid.
 */
const depIsValid = (modulePath: AbsolutePath, analyzer: AnalyzerInterface) => {
  if (analyzer.moduleCache.has(modulePath)) {
    // If a dep has a model, it is valid only if its deps are valid
    return Boolean(getAndValidateModuleFromCache(modulePath, analyzer));
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
  const outputPath = ts
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
): AbsolutePath => {
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
): AbsolutePath => {
  const resolvedPath = ts.resolveModuleName(
    specifier,
    location.getSourceFile().fileName,
    analyzer.commandLine.options,
    analyzer.fs
  ).resolvedModule?.resolvedFileName;
  if (resolvedPath === undefined) {
    throw new DiagnosticsError(
      location,
      `Could not resolve specifier ${specifier} to filesystem path.`
    );
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
