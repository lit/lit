/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import * as path from 'path';

export type AbsolutePath = string & {
  __absolutePathBrand: never;
};

/**
 * A path relative to a package root
 */
export type PackagePath = string & {
  __packagePathBrand: never;
};

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

export const sourceToJs = (
  sourcePath: PackagePath,
  sourceRootDir = '',
  packageRoot: AbsolutePath
): PackagePath => {
  const relativeSourceRoot = path.relative(packageRoot, sourceRootDir);
  // TODO(kschaaf): if not provided, rootDir defaults to "The longest
  // common path of all non-declaration input files." Not sure if we
  // should calculate the fallback ourselves based on the input globs.
  if (!sourcePath.startsWith(relativeSourceRoot)) {
    throw new Error(
      `Expected Lit module typescript sources to exist in the ` +
        `tsconfig.json 'rootDir' folder ('${relativeSourceRoot}')`
    );
  }
  // Remove src/ root, change ts -> js
  return path
    .relative(relativeSourceRoot, sourcePath)
    .replace(/\.ts$/, '.js') as PackagePath;
};
