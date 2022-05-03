/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {promisify} from 'util';
import {exec as execCb} from 'child_process';
import * as fs from 'fs/promises';
import * as path from 'path';
import {PackageJson} from '@lit-labs/analyzer/lib/model.js';

const exec = promisify(execCb);

/**
 * Map npm package name to folder to npm link
 */
export interface LinkedPackages {
  [index: string]: string;
}

/**
 * npm installs the package in the given packageRoot, optionally linking the
 * specified packages to the folders given.
 *
 * @param packageRoot
 * @param linkedPackages
 */
export const installPackage = async (
  packageRoot: string,
  linkedPackages?: LinkedPackages
) => {
  // Read package.json
  const packageFile = path.join(packageRoot, 'package.json');
  const packageText = await fs.readFile(packageFile, 'utf8');
  const packageJson = JSON.parse(packageText) as PackageJson;
  if (linkedPackages !== undefined) {
    for (const [pkg, folder] of Object.entries(linkedPackages)) {
      const linkedFolder = `file:${path.relative(packageRoot, folder)}`;
      if (packageJson.dependencies?.[pkg] !== undefined) {
        packageJson.dependencies[pkg] = linkedFolder;
      } else if (packageJson.devDependencies?.[pkg] !== undefined) {
        packageJson.devDependencies[pkg] = linkedFolder;
      } else if (packageJson.peerDependencies?.[pkg] !== undefined) {
        packageJson.peerDependencies[pkg] = linkedFolder;
      } else {
        throw new Error(
          `Linked package '${pkg}' was not a dependency of '${packageFile}'.`
        );
      }
      try {
        await fs.access(folder);
      } catch {
        throw new Error(
          `Folder ${folder} for linked package '${pkg}' did not exist.`
        );
      }
    }
    await fs.writeFile(
      packageFile,
      JSON.stringify(packageJson, null, 2),
      'utf8'
    );
  }
  // Install
  await exec('npm install', {cwd: packageRoot});
  // Restore package.json
  await fs.writeFile(packageFile, packageText, 'utf8');
};

export const buildPackage = async (packageRoot: string) => {
  try {
    await exec('npm run build', {cwd: packageRoot});
  } catch (e) {
    const {stdout} = e as {stdout: string};
    throw new Error(`Failed to build package '${packageRoot}': ${stdout}`);
  }
};
