/**
 * @license
 * Copyright The Lit Project Contributors.
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {FileTree} from '@oicl-lit/gen-utils/lib/file-utils.js';
import {Language} from '../../../commands/init.js';

export const generateGitignore = (lang: Language): FileTree => {
  return {
    '.gitignore': `node_modules${
      lang !== 'ts'
        ? ''
        : `
lib`
    }`,
  };
};
