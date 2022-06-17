/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {
  getLitModules,
  LitModule,
  Package,
  PackageJson,
} from '@lit-labs/analyzer/lib/model.js';
import {FileTree} from '@lit-labs/gen-utils/lib/file-utils.js';
import {packageJsonTemplate} from './lib/package-json-template.js';
import {tsconfigTemplate} from './lib/tsconfig-template.js';
import {wrapperModuleTemplate} from './lib/wrapper-module-template.js';
import * as fs from 'fs/promises';
import * as path from 'path';
import {AbsolutePath} from '@lit-labs/analyzer/lib/paths.js';
import {angularJsonProject} from './lib/angular-json-project.js';
import {exec as execCb} from 'child_process';
import {promisify} from 'util';

const exec = promisify(execCb);

export const generateAngularWrapper = async (
  analysis: Package,
  angularWorkspaceFolder: AbsolutePath
): Promise<FileTree> => {
  console.log('Angular Generator');

  const litModules: LitModule[] = getLitModules(analysis);
  if (litModules.length === 0) {
    throw new Error('No Lit components were found in this package.');
  }

  const packageName = analysis.packageJson.name;
  if (packageName === undefined) {
    throw new Error(
      `Package must have a package name. Error in ${
        analysis.rootDir + '/package.json'
      }`
    );
  }

  const {stdout: ngVersionOut} = await exec('ng --version');
  console.log({ngVersionOut});

  const angularJsonPath = path.resolve(angularWorkspaceFolder, 'angular.json');
  const angularJson = JSON.parse(await fs.readFile(angularJsonPath, 'utf-8'));
  const newProjectRoot = angularJson.newProjectRoot ?? 'projects';

  // TODO(justinfagnani): make package name configurable
  const angularPackageName = `${packageName}-ng`;
  const angularPackageDir = `${path.basename(analysis.rootDir)}-ng`;
  const angularPackageFolder = path.resolve(
    angularWorkspaceFolder,
    newProjectRoot,
    angularPackageDir
  );

  // Update angular.json
  if (angularJson.projects[angularPackageName] !== undefined) {
    // TODO(justinfagnani): handle updating a package. Maybe just overwrite?
    throw new Error(`project.${angularPackageName} already exists`);
  }
  angularJson.projects[angularPackageName] = angularJsonProject(
    angularPackageDir,
    newProjectRoot
  );
  // TODO: use FS abstraction instead of the fs module
  await fs.writeFile(angularJsonPath, JSON.stringify(angularJson), 'utf8');

  // Update workspace package.json
  const workspacePackageJsonPath = path.resolve(
    angularWorkspaceFolder,
    'package.json'
  );
  const workspacePackageJson = JSON.parse(
    await fs.readFile(workspacePackageJsonPath, 'utf8')
  );
  // TODO: run `npm i -D` to get latest versions?
  workspacePackageJson.devDependencies['@angular-devkit/build-angular'] ??=
    '^14.0.0';
  workspacePackageJson.devDependencies['ng-packagr'] ??= '^14.0.0';
  await fs.writeFile(
    workspacePackageJsonPath,
    JSON.stringify(workspacePackageJson),
    'utf8'
  );

  return {
    [angularPackageFolder]: {
      '.gitignore': gitIgnoreTemplate(litModules),
      'package.json': packageJsonTemplate(
        angularPackageName,
        analysis.packageJson,
        litModules
      ),
      'tsconfig.json': tsconfigTemplate(),
      ...wrapperFiles(analysis.packageJson, litModules),
    },
  };
};

const wrapperFiles = (packageJson: PackageJson, litModules: LitModule[]) => {
  const wrapperFiles: FileTree = {};
  for (const {
    module: {sourcePath, jsPath},
    elements,
  } of litModules) {
    wrapperFiles[sourcePath] = wrapperModuleTemplate(
      packageJson,
      jsPath,
      elements
    );
  }
  return wrapperFiles;
};

const gitIgnoreTemplate = (litModules: LitModule[]) => {
  return litModules.map(({module}) => module.jsPath).join('\n');
};
