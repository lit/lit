/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {AnalyzerInterface} from './model.js';

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
  packageRoot: AbsolutePath,
  seperator: string
): PackagePath => {
  if (!path.startsWith(packageRoot)) {
    throw new Error(`path ${path} is not contained in ${packageRoot}`);
  }
  let packagePath = path.substring(packageRoot.length);
  if (!packageRoot.endsWith(seperator)) {
    // Make sure we don't have path='/abc/def' and root='/ab'
    if (!packagePath.startsWith(seperator)) {
      throw new Error(`path ${path} is not contained in ${packageRoot}`);
    }
    packagePath = packagePath.substring(1, packagePath.length);
  }
  return packagePath as PackagePath;
};

export const resolveExtension = (
  path: AbsolutePath,
  analyzer: AnalyzerInterface,
  extensions = ['js', 'mjs']
) => {
  if (analyzer.fs.fileExists(path)) {
    return path;
  }
  for (const ext of extensions) {
    const fileName = `${path}.${ext}`;
    if (analyzer.fs.fileExists(fileName)) {
      return fileName;
    }
  }
  throw new Error(`Could not resolve ${path} to a file on disk.`);
};
