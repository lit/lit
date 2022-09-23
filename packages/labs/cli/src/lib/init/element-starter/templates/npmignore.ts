/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {FileTree} from '@lit-labs/gen-utils/lib/file-utils.js';

export const generateNpmignore = (): FileTree => {
  return {
    '.npmignore': `node_modules
.vscode
README.md
index.html
src`,
  };
};
