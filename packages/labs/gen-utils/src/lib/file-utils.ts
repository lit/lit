/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import * as fs from 'fs/promises';
import * as path from 'path';

export interface FileTree {
  [index: string]: string | FileTree;
}

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
  for (const [name, fileOrFolder] of Object.entries(tree)) {
    const fullPath = path.join(outDir, name);
    const folder = path.dirname(fullPath);
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
      v = v.flat().join('');
    }
    return prev + v + next;
  }, strings[0]);
};

/**
 * Use https://marketplace.visualstudio.com/items?itemName=Tobermory.es6-string-html
 * for JS syntax highlighting
 */
export const javascript = concat;
