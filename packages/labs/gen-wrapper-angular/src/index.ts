/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {
  getLitModules,
  LitModule,
  PackageJson,
} from '@lit-labs/analyzer/lib/model.js';
import {FileTree} from '@lit-labs/gen-utils/lib/file-utils.js';
import {installDepWithPermission} from '@lit-labs/cli/lib/install.js';
import type {GenerateOptions} from '@lit-labs/cli/lib/generate/generate.js';

import {packageJsonTemplate} from './lib/package-json-template.js';
import {tsconfigTemplate} from './lib/tsconfig-template.js';
import {wrapperModuleTemplate} from './lib/wrapper-module-template.js';
import * as fs from 'fs/promises';
import * as path from 'path';
import {AbsolutePath} from '@lit-labs/analyzer/lib/paths.js';
import {angularJsonProject} from './lib/angular-json-project.js';
import {exec as execCb, ExecException} from 'child_process';
import {promisify} from 'util';

const exec = promisify(execCb);

/**
 * See ../../cli/src/lib/generate/generate.ts
 */
export const getCommand = () => {
  return {
    name: 'angular',
    description: 'Generate Angular wrapper components from Lit elements',
    kind: 'resolved',
    async generate(options: GenerateOptions): Promise<FileTree> {
      // TODO(justinfagnani): feed in ng generator specific command-line options
      return await generateAngularWrapper(
        options,
        '' as unknown as AbsolutePath
      );
    },
  };
};

export const generateAngularWrapper = async (
  options: GenerateOptions,
  angularWorkspaceFolder: AbsolutePath
): Promise<FileTree> => {
  console.log('Angular Generator');

  const {analysis} = options;

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

  try {
    const {stdout: ngVersionOut} = await exec('ng version');
    const version = parseAngularCLIVersion(ngVersionOut);
    console.log(`Angular CLI version: ${version}`);
  } catch (e: unknown) {
    // See https://nodejs.org/api/child_process.html#child_processexeccommand-options-callback
    const err = e as ExecException & {stdout: string; stderr: string};
    if (err.stderr.includes('command not found')) {
      await installDepWithPermission({
        description: 'The Angular CLI',
        npmPackage: '@angular/cli',
        global: true,
        cwd: options.cwd,
        stdin: options.stdin,
        console: options.console,
      });
      const {stdout: ngVersionOut} = await exec('ng version');
      const version = parseAngularCLIVersion(ngVersionOut);
      console.log(`Angular CLI version: ${version}`);
    }
  }

  // TODO:justinfagnani): temporary and incorrect check
  if (angularWorkspaceFolder === '') {
    throw new Error(`Invalid workspace path: ${angularWorkspaceFolder}`);
  }

  throw new Error('Not implemented');

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

const versionLineStart = 'Angular CLI: ';
const parseAngularCLIVersion = (versionOutput: string) => {
  const lines = versionOutput.split('\n');
  const versionLine = lines.find((line) => line.startsWith(versionLineStart));
  const version = versionLine?.substring(versionLineStart.length);
  return version;
};
