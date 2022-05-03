/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import * as path from 'path';
import ts from 'typescript';

/**
 * An absolute path
 */
export type AbsolutePath = string & {
  __absolutePathBrand: never;
};

/**
 * A path relative to a package root
 */
export type PackagePath = string & {
  __packagePathBrand: never;
};

/**
 * Convert an absolute path to a package-relative path
 */
export const absoluteToPackage = (
  path: AbsolutePath,
  packageRoot: AbsolutePath
): PackagePath => {
  if (!path.startsWith(packageRoot)) {
    throw new Error(`path ${path} is not contained in ${packageRoot}`);
  }
  let packagePath = path.substring(packageRoot.length);
  if (!packageRoot.endsWith('/')) {
    // Make sure we don't have path='/abc/def' and root='/ab'
    if (!packagePath.startsWith('/')) {
      throw new Error(`path ${path} is not contained in ${packageRoot}`);
    }
    packagePath = packagePath.substring(1, packagePath.length);
  }
  return packagePath as PackagePath;
};

/**
 * Convert a typescript source path to its built path
 */
export const sourceToJs = (
  sourcePath: PackagePath,
  packageRoot: AbsolutePath,
  tsConfig: ts.ParsedCommandLine
): PackagePath => {
  // TODO(kschaaf): if not provided, rootDir defaults to "The longest common
  // path of all non-declaration input files." Not sure if we need to calculate
  // the fallback ourselves based on the input globs or if ts does that for us.
  const {rootDir = '', outDir = rootDir} = tsConfig.options;
  const pkgRootDir = path.relative(packageRoot, rootDir);
  const pkgOutDir = path.relative(packageRoot, outDir);
  if (!sourcePath.startsWith(pkgRootDir)) {
    throw new Error(
      `Expected Lit module typescript sources to exist in the ` +
        `tsconfig.json 'rootDir' folder ('${pkgRootDir}')`
    );
  }
  // Remove source folder, add output folder, change ts -> js
  return path.join(
    pkgOutDir,
    path.relative(pkgRootDir, sourcePath.replace(/\.ts$/, '.js'))
  ) as PackagePath;
};
