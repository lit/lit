/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
import * as path from 'path';
import {
  getLitModules,
  LitModule,
  Package,
  PackageJson,
} from '@lit-labs/analyzer/lib/model.js';
import {packageJsonTemplate} from './lib/package-json-template.js';
import {tsconfigTemplate} from './lib/tsconfig-template.js';
import {wrapperModuleTemplate} from './lib/wrapper-module-template.js';
import {FileTree} from '@lit-labs/gen-utils/lib/file-utils.js';

export const generateVueWrapper = async (
  analysis: Package
): Promise<FileTree> => {
  const litModules: LitModule[] = getLitModules(analysis);
  if (litModules.length > 0) {
    // Base the generated package folder name off the analyzed package folder
    // name, not the npm package name, since that might have an npm org in it
    const vuePkgName = packageNameToVuePackageName(
      path.basename(analysis.rootDir)
    );
    return {
      [vuePkgName]: {
        '.gitignore': gitIgnoreTemplate(litModules),
        'package.json': packageJsonTemplate(
          vuePkgName,
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

// TODO(kschaaf): Should this be configurable?
const packageNameToVuePackageName = (pkgName: string) => `${pkgName}-vue`;

const gitIgnoreTemplate = (litModules: LitModule[]) => {
  return litModules.map(({module}) => module.jsPath).join('\n');
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
