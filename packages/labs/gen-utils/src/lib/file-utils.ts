/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import * as fs from 'fs/promises';
import * as path from 'path';

/**
 * Object with keys either specifying a filename (with value of string contents)
 * or a folder name (with value of another FileTree object). As a convenience,
 * filenames may contain slashes, in which case folders are automatically
 * created.
 */
export interface FileTree {
  [path: string]: string | FileTree;
}

/**
 * Test whether a path is contained within a root path
 */
export const pathIsinRootPath = (path: string, rootPath: string) => {
  if (!path.startsWith(rootPath)) {
    return false;
  }
  const subpath = path.substring(rootPath.length);
  if (!rootPath.endsWith('/')) {
    // Make sure we don't have path='/abc/def' and root='/ab'
    if (!subpath.startsWith('/')) {
      return false;
    }
  }
  return true;
};

/**
 * Writes a tree of files to an output folder.
 *
 * @param outDir Root folder to write files into
 * @param tree Object with keys either specifying a filename (with value
 * of string contents) or a folder name (with value of another FileTree object).
 * As a convenience, filenames may contain slashes, in which case folders
 * are automatically created.
 */
export const writeFileTree = async (outDir: string, tree: FileTree) => {
  outDir = path.resolve(outDir);
  for (const [name, fileOrFolder] of Object.entries(tree)) {
    const fullPath = path.resolve(outDir, name);
    if (!pathIsinRootPath(fullPath, outDir)) {
      throw new Error(
        `Path '${fullPath}' is not contained in '${outDir}' when writing a ` +
          `file tree containing an entry of '${name}'.`
      );
    }
    const folder = path.dirname(fullPath);
    // TODO(kschaaf) Consider making this recursion async for parallel i/o
    if (typeof fileOrFolder === 'string') {
      await fs.mkdir(folder, {recursive: true});
      await fs.writeFile(fullPath, fileOrFolder);
    } else {
      await writeFileTree(fullPath, fileOrFolder);
    }
  }
};

/**
 * Generic tagged-template literal string concatenator with array value
 * flattening. Can be assigned to various tag names for syntax highlighting.
 */
const concat = (strings: TemplateStringsArray, ...values: unknown[]) => {
  return strings.slice(1).reduce((prev, next, i) => {
    let v = values[i];
    if (Array.isArray(v)) {
      v = v.flat(Infinity).join('');
    }
    return prev + v + next;
  }, strings[0]);
};

/**
 * Use https://marketplace.visualstudio.com/items?itemName=Tobermory.es6-string-html
 * for JS syntax highlighting
 */
export const javascript = concat;
