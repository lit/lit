/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
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

export const absoluteToPackage = (
  path: AbsolutePath,
  root: AbsolutePath
): PackagePath => {
  if (!path.startsWith(root)) {
    throw new Error(`path ${path} is not contained in ${root}`);
  }
  let packagePath = path.substring(root.length);
  if (!root.endsWith('/')) {
    // Make sure we don't have path='/abc/def' and root='/ab'
    if (!packagePath.startsWith('/')) {
      throw new Error(`path ${path} is not contained in ${root}`);
    }
    packagePath = packagePath.substring(1, packagePath.length);
  }
  return packagePath as PackagePath;
};
