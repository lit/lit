/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import * as pathlib from 'path';

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
  if (!packageRoot.endsWith(pathlib.sep)) {
    // Make sure we don't have path='/abc/def' and root='/ab'
    if (!packagePath.startsWith(pathlib.sep)) {
      throw new Error(`path ${path} is not contained in ${packageRoot}`);
    }
    packagePath = packagePath.substring(1, packagePath.length);
  }
  return packagePath as PackagePath;
};
