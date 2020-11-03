/**
 * @license
 * Copyright (c) 2020 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
 */

// We want to avoid formatting and linting all Git-ignored files, plus a few
// additional patterns. However, neither Prettier [1] nor ESLint [2] support
// passing multiple ignore files. So, we instead maintain separate
// .prettierignore and .eslintignore files, but automatically inject the
// contents of .gitignore into them.
//
// [1] https://github.com/prettier/prettier/issues/8048
// [2] https://github.com/eslint/eslint/issues/9794

import * as fs from 'fs';

const gitIgnore = fs.readFileSync('.gitignore', 'utf8');

const insertGitIgnore = (path) => {
  const before = fs.readFileSync(path, 'utf8');
  const pattern = /^(# GITIGNORE START\n)(.*)(^# GITIGNORE END)/ms;
  let matched = false;
  const after = before.replace(pattern, (_match, start, _oldGitIgnore, end) => {
    matched = true;
    return start + gitIgnore + end;
  });
  if (!matched) {
    throw new Error(`${path} did not have GITIGNORE START and END comments`);
  }
  if (after !== before) {
    fs.writeFileSync(path, after, 'utf8');
  }
};

insertGitIgnore('.prettierignore');
insertGitIgnore('.eslintignore');
