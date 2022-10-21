/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import * as path from 'path';
import {
  Package,
  PackageJson,
  LitElementDeclaration,
  ModuleWithLitElementDeclarations,
  getImportsStringForReferences,
} from '@lit-labs/analyzer';
import {Event as ModelEvent} from '@lit-labs/analyzer/lib/model.js';
import {FileTree} from '@lit-labs/gen-utils/lib/file-utils.js';
import {javascript, kabobToOnEvent} from '@lit-labs/gen-utils/lib/str-utils.js';

/**
 * Our command for the Lit CLI.
 *
 * See ../../cli/src/lib/generate/generate.ts
 */
export const getCommand = () => {
  return {
    name: 'react',
    description: 'Generate React wrapper components from Lit elements',
    kind: 'resolved',
    async generate(options: {package: Package}): Promise<FileTree> {
      return await generateReactWrapper(options.package);
    },
  };
};

export const generateReactWrapper = async (pkg: Package): Promise<FileTree> => {
  const litModules = pkg.getLitElementModules();
  if (litModules.length > 0) {
    // Base the generated package folder name off the analyzed package folder
    // name, not the npm package name, since that might have an npm org in it
    const reactPkgFolder = packageNameToReactPackageName(
      path.basename(pkg.rootDir)
    );
    return {
      [reactPkgFolder]: {
        '.gitignore': gitIgnoreTemplate(litModules),
        'package.json': packageJsonTemplate(pkg.packageJson, litModules),
        'tsconfig.json': tsconfigTemplate(),
        ...wrapperFiles(pkg.packageJson, litModules),
      },
    };
  } else {
    throw new Error('No Lit components were found in this package.');
  }
};

const wrapperFiles = (
  packageJson: PackageJson,
  litModules: ModuleWithLitElementDeclarations[]
) => {
  const wrapperFiles: FileTree = {};
  for (const {module, declarations} of litModules) {
    const {sourcePath, jsPath} = module;
    wrapperFiles[sourcePath] = wrapperModuleTemplate(
      packageJson,
      jsPath,
      declarations
    );
  }
  return wrapperFiles;
};

const packageJsonTemplate = (
  pkgJson: PackageJson,
  litModules: ModuleWithLitElementDeclarations[]
) => {
  // Refinement of package.json generation ala the TODOs below tracked in
  // https://github.com/lit/lit/issues/2855

  // TODO(kschaaf): spread in/adapt other relevant fields from source
  // package.json (description, license, keywords, etc.)
  return JSON.stringify(
    {
      name: packageNameToReactPackageName(pkgJson.name!),
      type: 'module',
      scripts: {
        build: 'tsc',
        'build:watch': 'tsc --watch',
      },
      // TODO(kschaaf): Version in lock-step with source?
      version: pkgJson.version,
      dependencies: {
        // TODO(kschaaf): make component version range configurable?
        [pkgJson.name!]: '^' + pkgJson.version!,
        // TODO(kschaaf): make @lit-labs/react version configurable?
        '@lit-labs/react': '^1.0.4',
      },
      peerDependencies: {
        // TODO(kschaaf): make react version(s) configurable?
        react: '^17 || ^18',
        '@types/react': '^17 || ^18',
      },
      devDependencies: {
        // Use typescript from source package, assuming it exists
        typescript: pkgJson?.devDependencies?.typescript ?? '~4.7.4',
      },
      files: [
        ...litModules.map(({module}) =>
          module.jsPath.replace(/js$/, '{js,js.map,d.ts,d.ts.map}')
        ),
      ],
    },
    null,
    2
  );
};

const gitIgnoreTemplate = (litModules: ModuleWithLitElementDeclarations[]) => {
  return litModules.map(({module}) => module.jsPath).join('\n');
};

const tsconfigTemplate = () => {
  return JSON.stringify(
    {
      compilerOptions: {
        target: 'es2019',
        module: 'es2015',
        lib: ['es2020', 'DOM', 'DOM.Iterable'],
        declaration: true,
        declarationMap: true,
        sourceMap: true,
        inlineSources: true,
        outDir: './',
        rootDir: './src',
        strict: true,
        noUnusedLocals: true,
        noUnusedParameters: true,
        noImplicitReturns: true,
        noFallthroughCasesInSwitch: true,
        noImplicitAny: true,
        noImplicitThis: true,
        moduleResolution: 'node',
        allowSyntheticDefaultImports: true,
        experimentalDecorators: true,
        noImplicitOverride: true,
      },
      include: ['src/**/*.ts'],
      exclude: [],
    },
    null,
    2
  );
};

const getTypeImports = (declarations: LitElementDeclaration[]) => {
  // We only need type imports for events.
  const refs = declarations.flatMap(({events}) =>
    Array.from(events.values()).flatMap((e) => e.type?.references ?? [])
  );
  return getImportsStringForReferences(refs);
};

const wrapperModuleTemplate = (
  packageJson: PackageJson,
  moduleJsPath: string,
  elements: LitElementDeclaration[]
) => {
  const hasEvents = elements.filter(({events}) => events.size).length > 0;
  return javascript`
 import * as React from 'react';
 import {createComponent${
   hasEvents ? `, EventName` : ``
 }} from '@lit-labs/react';
 ${elements.map((element) => {
   const path = `${packageJson.name}/${moduleJsPath}`;
   return javascript`
 import {${element.name} as ${element.name}Element} from '${path}';
 export * from '${path}';
 ${getTypeImports(elements)}
 `;
 })}

 ${elements.map((element) => wrapperTemplate(element))}
 `;
};

// TODO(kschaaf): Should this be configurable?
const packageNameToReactPackageName = (pkgName: string) => `${pkgName}-react`;

const wrapperTemplate = ({name, tagname, events}: LitElementDeclaration) => {
  return javascript`
 export const ${name} = createComponent(
   React,
   '${tagname}',
   ${name}Element,
   {
     ${Array.from(events.values()).map((event: ModelEvent) => {
       const {name, type} = event;
       return javascript`
     ${kabobToOnEvent(name)}: '${name}' as EventName<${
         type?.text || `CustomEvent<unknown>`
       }>,`;
     })}
   }
 );
 `;
};
