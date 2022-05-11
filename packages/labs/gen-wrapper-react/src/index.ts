/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {
  ClassDeclaration,
  LitElementDeclaration,
  Module,
  Package,
  PackageJson,
} from '@lit-labs/analyzer/lib/model.js';
import {javascript, FileTree} from '@lit-labs/gen-utils/lib/file-utils.js';

// TODO(kschaaf): Move helpers into analyzer
const isLitElementDeclaration = (
  dec: ClassDeclaration
): dec is LitElementDeclaration => {
  return (dec as LitElementDeclaration).isLitElement;
};

interface LitModule {
  module: Module;
  elements: LitElementDeclaration[];
}

// TODO(kschaaf): Move helpers into analyzer
const getLitModules = (analysis: Package) => {
  const modules: LitModule[] = [];
  for (const module of analysis.modules) {
    const elements = module.declarations.filter(isLitElementDeclaration);
    if (elements.length > 0) {
      modules.push({
        module,
        elements,
      });
    }
  }
  return modules;
};

export const generateReactWrapper = async (
  analysis: Package
): Promise<FileTree> => {
  const litModules: LitModule[] = getLitModules(analysis);
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

const packageJsonTemplate = (pkgJson: PackageJson, litModules: LitModule[]) => {
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
        react: '^17.0.2',
        '@types/react': '^17.0.19',
      },
      devDependencies: {
        // TODO(kschaaf): make configurable?
        typescript: '^4.3.5',
      },
      files: [...litModules.map(({module}) => module.jsPath)],
    },
    null,
    2
  );
};

const gitIgnoreTemplate = (litModules: LitModule[]) => {
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
    ${eventNameToCallbackName(eventName)}: '${
        // TODO(kschaaf): add cast to `as EventName<EVENT_TYPE>` once the
        // analyzer reports the event type correctly (currently we have the
        // type string without an AST reference to get its import, etc.)
        // https://github.com/lit/lit/issues/2850
        eventName
      }',`
    )}
  }
);    
`;
};
