/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {AnalyzerInterface, PackageInfo, PackageJson} from '../model.js';
import {AbsolutePath} from '../paths.js';

/**
 * Starting from a given module path, searches up until the nearest package.json
 * is found, returning that folder. If none is found, an error is thrown.
 */
export const getPackageRootForModulePath = (
  modulePath: AbsolutePath,
  analyzer: AnalyzerInterface
): AbsolutePath => {
  // TODO(kschaaf): Add caching & invalidation
  const {fs, path} = analyzer;
  let searchDir = modulePath as string;
  const root = path.parse(searchDir).root;
  while (!fs.fileExists(path.join(searchDir, 'package.json'))) {
    if (searchDir === root) {
      throw new Error(`No package.json found for module path ${modulePath}`);
    }
    searchDir = path.dirname(searchDir);
  }
  return searchDir as AbsolutePath;
};

/**
 * Reads and parses a package.json file contained in the given folder.
 */
const getPackageJsonFromPackageRoot = (
  packageRoot: AbsolutePath,
  analyzer: AnalyzerInterface
): PackageJson => {
  // TODO(kschaaf): Add caching & invalidation
  const {fs, path} = analyzer;
  const packageJson = fs.readFile(path.join(packageRoot, 'package.json'));
  if (packageJson !== undefined) {
    return JSON.parse(packageJson) as PackageJson;
  }
  throw new Error(`No package.json found at ${packageRoot}`);
};

/**
 * Returns an analyzer `PackageInfo` model for the nearest package of the given
 * path.
 */
export const getPackageInfo = (
  path: AbsolutePath,
  analyzer: AnalyzerInterface
) => {
  const rootDir = getPackageRootForModulePath(path, analyzer);
  const packageJson = getPackageJsonFromPackageRoot(rootDir, analyzer);
  const {name} = packageJson;
  if (name === undefined) {
    throw new Error(
      `Expected package name in ${analyzer.path.join(rootDir, 'package.json')}`
    );
  }
  return new PackageInfo({
    name,
    rootDir: analyzer.path.normalize(rootDir) as AbsolutePath,
    packageJson,
  });
};
