/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import * as fs from 'fs/promises';
import * as path from 'path';

/**
 * Updates a global version variable.
 */
const updateVersionVariable = async (packageDir, sourcePath, variableName) => {
  // Read new version from package.json
  const packagePath = path.resolve('./packages', packageDir, 'package.json');
  const packageSource = await fs.readFile(packagePath, 'utf-8');
  const packageData = JSON.parse(packageSource);
  const {version} = packageData;

  // Read source file
  const filePath = path.resolve('./packages', packageDir, 'src', sourcePath);
  console.log(`updating version for ${filePath} to ${version}`);
  const fileSource = await fs.readFile(filePath, 'utf-8');

  // Replace version number
  const versionVarRegex = new RegExp(
    `(\\(global(?:This)?\\.${variableName} \\?\\?= \\[\\]\\)\\.push\\(')\\d+\\.\\d+\\.\\d+[^']*('\\))`
  );
  let replaced = false;
  const newSource = fileSource.replace(versionVarRegex, (_, pre, post) => {
    replaced = true;
    return pre + version + post;
  });
  if (!replaced) {
    throw new Error(`Version variable not found: ${filePath} ${variableName}`);
  }

  // Write file
  await fs.writeFile(filePath, newSource);
};

await Promise.all([
  updateVersionVariable('lit-html', 'lit-html.ts', 'litHtmlVersions'),
  updateVersionVariable('lit-element', 'lit-element.ts', 'litElementVersions'),
  updateVersionVariable(
    'reactive-element',
    'reactive-element.ts',
    'reactiveElementVersions'
  ),
]);
