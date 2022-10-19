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
  DeclarationMap,
} from '../model.js';
import {getClassDeclarationInfo} from './classes.js';
import {getVariableDeclarationInfo} from './variables.js';
import {AbsolutePath, absoluteToPackage} from '../paths.js';
import {getPackageInfo} from './packages.js';
import {DiagnosticsError} from '../errors.js';

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
  // The packageRoot for this module is needed for translating the source file
  // path to a package relative path, and the packageName is needed for
  // generating references to any symbols in this module.
  const {rootDir, packageJson} = packageInfo;
  const sourcePath = absoluteToPackage(
    analyzer.path.normalize(modulePath) as AbsolutePath,
    rootDir
  );
  const jsPath = absoluteToPackage(
    getJSPathFromSourcePath(modulePath as AbsolutePath, analyzer),
    rootDir
  );
  const dependencies = new Set<AbsolutePath>();
  const declarationMap: DeclarationMap = new Map<string, () => Declaration>();
  const addDeclaration = (info: DeclarationInfo) => {
    const {name, factory} = info;
    declarationMap.set(name, factory);
  };

  // Find and add models for declarations in the module
  // TODO(kschaaf): Add Function and MixinDeclarations
  for (const statement of sourceFile.statements) {
    if (ts.isClassDeclaration(statement)) {
      addDeclaration(getClassDeclarationInfo(statement, analyzer));
    } else if (ts.isVariableStatement(statement)) {
      getVariableDeclarationInfo(statement, analyzer).forEach(addDeclaration);
    } else if (ts.isImportDeclaration(statement)) {
      dependencies.add(
        getPathForModuleSpecifierExpression(statement.moduleSpecifier, analyzer)
      );
    }
  }
  // Construct module and save in cache
  const module = new Module({
    sourcePath,
    jsPath,
    sourceFile,
    packageJson,
    declarationMap,
    dependencies,
  });
  analyzer.moduleCache.set(
    analyzer.path.normalize(sourceFile.fileName) as AbsolutePath,
    module
  );
  return module;
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
 * Resolve a module specifier to an absolute path on disk.
 */
export const getPathForModuleSpecifierExpression = (
  moduleSpecifier: ts.Expression,
  analyzer: AnalyzerInterface
): AbsolutePath => {
  const specifier = moduleSpecifier.getText().slice(1, -1);
  const resolvedPath = ts.resolveModuleName(
    specifier,
    moduleSpecifier.getSourceFile().fileName,
    analyzer.commandLine.options,
    analyzer.fs
  ).resolvedModule?.resolvedFileName;
  if (resolvedPath === undefined) {
    throw new DiagnosticsError(
      moduleSpecifier,
      `Could not resolve specifier to filesystem path.`
    );
  }
  return analyzer.path.normalize(resolvedPath) as AbsolutePath;
};
