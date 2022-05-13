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
 * Map npm package name to folder in monorepo to use instead
 */
export interface MonorepoPackages {
  [index: string]: string;
}

/**
 * Runs `npm i` in the package in the given packageRoot, optionally using
 * monorepo packages in place of installing from the registry.
 *
 * Note that rather than using an `npm link` / symlink approach for substituting
 * monorepo packages, we use `npm pack` and point package.json to the tarball
 * for that package. This more closely matches how a given test package will be
 * installed  from the registry, and avoids issues when a monorepo has
 * peerDependencies (since a monorepo package will have its own copy of its
 * peerDependencies installed, which is not what will happen when installed as a
 * dependency itself).
 *
 * @param packageRoot
 * @param linkedPackages
 */
export const installPackage = async (
  packageRoot: string,
  monorepoPackages?: MonorepoPackages
) => {
  // Read package.json
  const packageFile = path.join(packageRoot, 'package.json');
  const packageText = await fs.readFile(packageFile, 'utf8');
  const packageJson = JSON.parse(packageText) as PackageJson;
  if (monorepoPackages !== undefined) {
    let deps;
    for (const [pkg, folder] of Object.entries(monorepoPackages)) {
      // Figure out what kind of dep the linked dep is
      if (packageJson.dependencies?.[pkg] !== undefined) {
        deps = packageJson.dependencies;
      } else if (packageJson.devDependencies?.[pkg] !== undefined) {
        deps = packageJson.devDependencies;
      } else if (packageJson.peerDependencies?.[pkg] !== undefined) {
        deps = packageJson.peerDependencies;
      } else {
        // TODO(kschaaf) Would be nice to also validate the monorepo package
        // fulfills the generated version constraint
        throw new Error(
          `Linked package '${pkg}' was not a dependency of '${packageFile}'.`
        );
      }
      // Make sure the folder for the package to link exists
      try {
        await fs.access(folder);
      } catch {
        throw new Error(
          `Folder ${folder} for linked package '${pkg}' did not exist.`
        );
      }
      // npm pack the linked package into a tarball
      const tarballFile = await packPackage(folder);
      // Update the package.json dep with a file path to the tarball
      deps[pkg] = `file:${tarballFile}`;
    }
    // Write out the updated package.json
    await fs.writeFile(
      packageFile,
      JSON.stringify(packageJson, null, 2),
      'utf8'
    );
  }
  try {
    // Install
    await exec('npm install', {cwd: packageRoot});
  } finally {
    // Restore package.json
    await fs.writeFile(packageFile, packageText, 'utf8');
  }
};

/**
 * Runs `npm run build` on the given package
 * @param packageRoot
 */
export const buildPackage = async (packageRoot: string) => {
  try {
    await exec('npm run build', {cwd: packageRoot});
  } catch (e) {
    const {stdout} = e as {stdout: string};
    throw new Error(`Failed to build package '${packageRoot}': ${stdout}`);
  }
};

/**
 * Runs `npm pack` on the given package
 * @param packageRoot
 * @returns Absolute path to the packaged tarball
 */
export const packPackage = async (packageRoot: string) => {
  try {
    const {stdout: tarballFile} = await exec('npm pack', {cwd: packageRoot});
    return path.resolve(packageRoot, tarballFile.trim());
  } catch (e) {
    const {stdout} = e as {stdout: string};
    throw new Error(`Failed to pack package '${packageRoot}': ${stdout}`);
  }
};
