/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {
  ClassDeclaration,
  LitElementDeclaration,
  Package,
  PackageJson,
} from '@lit-labs/analyzer/lib/model.js';
import {javascript, FileTree} from './utils.js';
import * as path from 'path';

const isLitElementDeclaration = (
  dec: ClassDeclaration
): dec is LitElementDeclaration => {
  return (dec as LitElementDeclaration).isLitElement;
};

interface LitModule {
  moduleSrcPath: string;
  moduleJsPath: string;
  elements: LitElementDeclaration[];
}

const getLitModules = (packageRoot: string, analysis: Package) => {
  return analysis.modules
    .map((module) => {
      const elements = module.declarations.filter(isLitElementDeclaration);
      if (elements.length) {
        const moduleSrcPath = path.relative(
          packageRoot,
          module.sourceFile.fileName
        );
        const srcRootDir = path.relative(
          packageRoot,
          // TODO(kschaaf): if not provided, rootDir defaults to "The longest
          // common path of all non-declaration input files." Not sure if we
          // should calculate the fallback ourselves based on the input globs.
          analysis.tsConfig.options.rootDir ?? ''
        );
        if (!moduleSrcPath.startsWith(srcRootDir)) {
          throw new Error(
            `Expected Lit module typescript sources to exist in the ` +
              `tsconfig.json 'rootDir' folder ('${srcRootDir}')`
          );
        }
        if (!moduleSrcPath.endsWith('.ts')) {
          throw new Error(
            'Expected Lit module typescript source to exist in a `.ts` file'
          );
        }
        const moduleJsPath = path
          .relative(srcRootDir, moduleSrcPath)
          .replace(/\.ts/, '.js');
        return {
          moduleSrcPath,
          moduleJsPath,
          elements,
        };
      } else {
        return undefined;
      }
    })
    .filter((mod) => mod !== undefined) as LitModule[];
};

export const run = async (
  packageRoot: string,
  analysis: Package,
  _console: Console
): Promise<FileTree> => {
  const litModules: LitModule[] = getLitModules(packageRoot, analysis);
  if (litModules.length > 0) {
    const reactPkgName = packageNameToReactPackageName(
      analysis.packageJson.name!
    );
    return {
      [reactPkgName]: {
        '.gitignore': gitIgnoreTemplate(litModules),
        'package.json': packageJsonTemplate(analysis.packageJson, litModules),
        'tsconfig.json': tsconfigTemplate(),
        ...wrapperFiles(analysis.packageJson, litModules),
      },
    };
  } else {
    // TODO(kschaaf) Should we warn if no LitElements were found?
    return {};
  }
};

const wrapperFiles = (packageJson: PackageJson, litModules: LitModule[]) => {
  const wrapperFiles: FileTree = {};
  for (const {moduleSrcPath, moduleJsPath, elements} of litModules) {
    wrapperFiles[moduleSrcPath] = wrapperModuleTemplate(
      packageJson,
      moduleJsPath,
      elements
    );
  }
  return wrapperFiles;
};

const packageJsonTemplate = (pkgJson: PackageJson, litModules: LitModule[]) => {
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
        // TODO(kschaaf): make version range configurable?
        [pkgJson.name!]: '^' + pkgJson.version!,
      },
      peerDependencies: {
        // TODO(kschaaf): make configurable?
        react: '^17.0.1',
      },
      devDependencies: {
        // TODO(kschaaf): make configurable?
        typescript: '^4.3.5',
      },
      files: [...litModules.map((m) => m.moduleJsPath)],
    },
    null,
    2
  );
};

const gitIgnoreTemplate = (litModules: LitModule[]) => {
  return litModules.map((m) => m.moduleJsPath).join('\n');
};

const tsconfigTemplate = () => {
  return JSON.stringify(
    {
      compilerOptions: {
        target: 'es2019',
        module: 'es2020',
        lib: ['es2020', 'DOM', 'DOM.Iterable'],
        declaration: true,
        declarationMap: true,
        sourceMap: true,
        inlineSources: true,
        outDir: './',
        rootDir: './src',
        strict: true,
        moduleResolution: 'node',
        allowSyntheticDefaultImports: true,
        stripInternal: true,
        noImplicitOverride: true,
      },
      include: ['src/**/*.ts'],
    },
    null,
    2
  );
};

const wrapperModuleTemplate = (
  packageJson: PackageJson,
  moduleJsPath: string,
  elements: LitElementDeclaration[]
) => {
  return javascript`
import * as React from 'react';
import {createComponent} from '@lit-labs/react';
${elements.map(
  (element) => javascript`
import {${element.name} as ${element.name}Element} from '${packageJson.name}/${moduleJsPath}';
`
)}

${elements.map((element) => wrapperTemplate(element))}
`;
};

// TODO(kschaaf): Should this be configurable?
const packageNameToReactPackageName = (pkgName: string) => `${pkgName}-react`;

const eventNameToCallbackName = (eventName: string) =>
  'on' +
  eventName[0].toUpperCase() +
  eventName.slice(1).replace(/-[a-z]/g, (m) => m[1].toUpperCase());

const wrapperTemplate = ({name, tagname, events}: LitElementDeclaration) => {
  return javascript`
export const ${name} = createComponent(
  React,
  '${tagname}',
  ${name}Element,
  {
    ${Array.from(events.keys()).map(
      (eventName) => javascript`
    ${eventNameToCallbackName(eventName)}: '${eventName}',`
    )}
  }
);    
`;
};
