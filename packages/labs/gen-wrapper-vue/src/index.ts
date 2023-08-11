/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
import * as path from 'path';
import {
  Package,
  PackageJson,
  ModuleWithLitElementDeclarations,
} from '@lit-labs/analyzer';
import {packageJsonTemplate} from './lib/package-json-template.js';
import {tsconfigTemplate} from './lib/tsconfig-template.js';
import {wrapperModuleTemplateSFC} from './lib/wrapper-module-template-sfc.js';
import {FileTree} from '@lit-labs/gen-utils/lib/file-utils.js';
import {tsconfigNodeTemplate} from './lib/tsconfig.node-template.js';
import {viteConfigTemplate} from './lib/vite.config-template.js';
import {renameTemplate} from './lib/rename-template.js';

export const getCommand = () => {
  return {
    name: 'vue',
    description: 'Generate Vue wrapper components from Lit elements',
    kind: 'resolved',
    async generate(options: {package: Package}): Promise<FileTree> {
      return generateVueWrapper(options.package);
    },
  };
};

export const generateVueWrapper = async (pkg: Package): Promise<FileTree> => {
  const litModules = pkg.getLitElementModules();
  if (litModules.length > 0) {
    // Base the generated package folder name off the analyzed package folder
    // name, not the npm package name, since that might have an npm org in it
    const vuePkgName = packageNameToVuePackageName(path.basename(pkg.rootDir));
    const sfcFiles = wrapperSFCFiles(pkg.packageJson, litModules);
    const moduleNames = Object.keys(sfcFiles).map((f) => {
      // Need to get module name to include sub path.
      const dirname = path.dirname(f);
      const basename = `${path.basename(f, '.vue')}`;
      const moduleName = path
        .join(dirname, basename)
        .replace(/\\/g, '/')
        .replace(/^src\//, '');
      return moduleName;
    });
    return {
      [vuePkgName]: {
        '.gitignore': gitIgnoreTemplate(moduleNames),
        'package.json': packageJsonTemplate(pkg.packageJson, moduleNames),
        'tsconfig.json': tsconfigTemplate(),
        'tsconfig.node.json': tsconfigNodeTemplate(),
        'vite.config.ts': viteConfigTemplate(pkg.packageJson, sfcFiles),
        'scripts/rename.js': renameTemplate(),
        ...sfcFiles,
      },
    };
  } else {
    throw new Error('No Lit components were found in this package.');
  }
};

// TODO(kschaaf): Should this be configurable?
const packageNameToVuePackageName = (pkgName: string) => `${pkgName}-vue`;

const gitIgnoreTemplate = (moduleNames: string[]) =>
  moduleNames.map((f) => `/${f}.*`).join('\n');

const getVueFileName = (dir: string, name: string) => `${dir}/${name}.vue`;

const wrapperSFCFiles = (
  packageJson: PackageJson,
  litModules: ModuleWithLitElementDeclarations[]
) => {
  const wrapperFiles: FileTree = {};
  for (const {module, declarations} of litModules) {
    const {sourcePath, jsPath} = module;
    // Format: [...[name, content]]
    const wrappers = wrapperModuleTemplateSFC(
      packageJson,
      jsPath,
      declarations
    );
    const dir = path.dirname(sourcePath);
    const exports: string[] = [];
    // TODO(sorvell): Throw if component names are re-used in the same folder.
    for (const [name, content] of wrappers) {
      exports.push(`export {default as ${name}} from './${name}.vue';`);
      wrapperFiles[getVueFileName(dir, name)] = content!;
    }
    // Note, if a given source module includes more than component, the author
    // probably intended to make them available via a single import and this
    // separate module preserves that intent.
    if (wrappers.length > 1) {
      wrapperFiles[sourcePath] = exports.join('/n');
    }
  }
  return wrapperFiles;
};
