/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import ts from 'typescript';
import {Module, AnalyzerContext, PackageJson} from '../model.js';
import {
  isLitElement,
  getLitElementDeclaration,
} from '../lit-element/lit-element.js';
import * as path from 'path';
import {getClassDeclaration} from './classes.js';
import {getVariableDeclarations} from './variables.js';
import {AbsolutePath, absoluteToPackage} from '../paths.js';

/**
 * Starting from a given module path, searches up until the nearest package.json
 * is found, returning that folder. If none is found, an error is thrown.
 */
const getPackageRootForModulePath = (
  modulePath: AbsolutePath,
  context: AnalyzerContext
): AbsolutePath => {
  // TODO(kschaaf): Add caching & invalidation
  const {fs, path} = context;
  let searchDir = path.dirname(modulePath);
  const root = path.parse(searchDir).root;
  while (searchDir !== root) {
    if (fs.fileExists(path.join(searchDir, 'package.json'))) {
      return searchDir as AbsolutePath;
    }
    searchDir = path.dirname(searchDir);
  }
  throw new Error(`No package.json found for module path ${modulePath}`);
};

/**
 * Reads and parses a package.json file contained in the given folder.
 */
const getPackageJsonFromPackageRoot = (
  packageRoot: AbsolutePath,
  context: AnalyzerContext
): PackageJson => {
  // TODO(kschaaf): Add caching & invalidation
  const {fs, path} = context;
  const packageJson = fs.readFile(path.join(packageRoot, 'package.json'));
  if (packageJson !== undefined) {
    return JSON.parse(packageJson) as PackageJson;
  }
  throw new Error(`No package.json found at ${packageRoot}`);
};

/**
 * Returns an analyzer `Module` model for the given ts.SourceFile.
 */
export const getModule = (
  sourceFile: ts.SourceFile,
  context: AnalyzerContext
) => {
  const fileName = sourceFile.fileName as AbsolutePath;
  // Find and load the package.json associated with this module; this both gives
  // us the packageRoot for this module (needed for translating the source file
  // path to a package relative path), as well as the packageName (needed for
  // generating references to any symbols in this module). This will need
  // caching/invalidation.
  const packageRoot = getPackageRootForModulePath(fileName, context);
  const packageJson = getPackageJsonFromPackageRoot(packageRoot, context);
  const sourcePath = absoluteToPackage(
    path.normalize(sourceFile.fileName) as AbsolutePath,
    packageRoot
  );
  const fullSourcePath = path.join(packageRoot, sourcePath);
  const jsPath = ts
    .getOutputFileNames(context.commandLine, fullSourcePath, false)
    .filter((f) => f.endsWith('.js'))[0];
  // TODO(kschaaf): this could happen if someone imported only a .d.ts file;
  // we might need to handle this differently
  if (jsPath === undefined) {
    throw new Error(`Could not determine output filename for '${sourcePath}'`);
  }

  const module = new Module({
    sourcePath,
    // The jsPath appears to come out of the ts API with unix
    // separators; since sourcePath uses OS separators, normalize
    // this so that all our model paths are OS-native
    jsPath: absoluteToPackage(
      path.normalize(jsPath) as AbsolutePath,
      packageRoot as AbsolutePath
    ),
    sourceFile,
    packageJson,
  });

  for (const statement of sourceFile.statements) {
    if (ts.isClassDeclaration(statement)) {
      module.declarations.push(
        isLitElement(statement, context)
          ? getLitElementDeclaration(statement, context)
          : getClassDeclaration(statement, context)
      );
    } else if (ts.isVariableStatement(statement)) {
      module.declarations.push(
        ...statement.declarationList.declarations
          .map((dec) => getVariableDeclarations(dec, dec.name, context))
          .flat()
      );
    }
  }
  return module;
};
