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
import * as path from 'path';
import {AbsolutePath} from '@lit-labs/analyzer/lib/paths.js';

export const generateAngularWrapper = async (
  analysis: Package,
  angularWorkspaceFolder: AbsolutePath
): Promise<FileTree> => {
  const litModules: LitModule[] = getLitModules(analysis);
  if (litModules.length > 0) {
    const packageName = analysis.packageJson.name;
    if (packageName === undefined) {
      throw new Error(
        `Package must have a package name. Error in ${
          analysis.rootDir + '/package.json'
        }`
      );
    }
    // TODO(justinfagnani): make configurable
    const angularPackageName = `${packageName}-ng`;
    const angularPackageFolder = path.resolve(
      angularWorkspaceFolder,
      'projects',
      `${path.basename(analysis.rootDir)}-ng`
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
  } else {
    throw new Error('No Lit components were found in this package.');
  }
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
