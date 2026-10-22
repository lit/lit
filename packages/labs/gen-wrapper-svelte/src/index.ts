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
} from '@oicl-lit/analyzer';
import {packageJsonTemplate} from './lib/package-json-template.js';
import {tsconfigTemplate} from './lib/tsconfig-template.js';
import {wrapperModuleTemplateSFC} from './lib/wrapper-module-template-sfc.js';
import {FileTree} from '@oicl-lit/gen-utils/lib/file-utils.js';
import {viteConfigTemplate} from './lib/vite.config-template.js';
import {svelteConfigTemplate} from './lib/svelteconf-template.js';
import {appHtmlTemplate} from './lib/app-html-template.js';
import {utilTemplate} from './lib/util-template.js';
import {namedSlotTemplate} from './lib/named-slot-template.js';

export const getCommand = () => {
  return {
    name: 'svelte',
    description: 'Generate Svelte wrapper components from Lit elements',
    kind: 'resolved',
    async generate(options: {package: Package}): Promise<FileTree> {
      return generateSvelteWrapper(options.package);
    },
  };
};

export const generateSvelteWrapper = async (
  pkg: Package
): Promise<FileTree> => {
  const litModules = pkg.getLitElementModules();
  if (litModules.length > 0) {
    // Base the generated package folder name off the analyzed package folder
    // name, not the npm package name, since that might have an npm org in it
    const sveltePkgName = packageNameToSveltePackageName(
      path.basename(pkg.rootDir)
    );
    const sfcFiles = wrapperSFCFiles(pkg.packageJson, litModules);

    return {
      [sveltePkgName]: {
        '.gitignore': ignoreTemplate(),
        '.prettierignore': ignoreTemplate(),
        'package.json': packageJsonTemplate(pkg.packageJson),
        'tsconfig.json': tsconfigTemplate(),
        'vite.config.ts': viteConfigTemplate(pkg.packageJson),
        'svelte.config.js': svelteConfigTemplate(),
        'src/app.html': appHtmlTemplate(),
        'src/lib/util.ts': utilTemplate(),
        'src/lib/NamedSlot.svelte': namedSlotTemplate(),
        ...sfcFiles,
      },
    };
  } else {
    throw new Error('No Lit components were found in this package.');
  }
};

// TODO(kschaaf): Should this be configurable?
const packageNameToSveltePackageName = (pkgName: string) => `${pkgName}-svelte`;

// Build output and dependencies. Unlike the Vue wrappers, Svelte wrappers are
// compiled into `dist/`, so there's nothing to ignore next to the sources.
const ignoreTemplate = () =>
  ['.svelte-kit/', 'dist/', 'node_modules/'].join('\n');

const getSvelteFileName = (dir: string, name: string) => {
  const dirname = dir.replace(/^src/g, 'src/lib');
  return path.join(dirname, `${name}.svelte`);
};

const wrapperSFCFiles = (
  packageJson: PackageJson,
  litModules: ModuleWithLitElementDeclarations[]
) => {
  const wrapperFiles: FileTree = {};
  const globalExports: string[] = [];
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
      exports.push(`export {default as ${name}} from './${name}.svelte';`);
      wrapperFiles[getSvelteFileName(dir, name)] = content!;
      // `sourcePath` uses the OS separator; import specifiers need `/`.
      const dirname = dir.replace(/\\/g, '/').replace(/^src/g, '');
      globalExports.push(
        `export {default as ${name}} from '.${dirname}/${name}.svelte';`
      );
    }
    // Note, if a given source module includes more than component, the author
    // probably intended to make them available via a single import and this
    // separate module preserves that intent.
    // It goes next to the wrappers in `src/lib` so its `./` specifiers resolve.
    if (wrappers.length > 1) {
      wrapperFiles[sourcePath.replace(/^src/, 'src/lib')] = exports.join('\n');
    }
  }
  wrapperFiles['src/lib/index.ts'] = globalExports.join('\n');
  return wrapperFiles;
};
