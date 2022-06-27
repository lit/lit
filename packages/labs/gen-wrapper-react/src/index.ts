/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import * as path from 'path';
import {
  getLitModules,
  LitElementDeclaration,
  LitModule,
  Package,
  PackageJson,
} from '@lit-labs/analyzer/lib/model.js';
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
    async generate(options: {analysis: Package}): Promise<FileTree> {
      return await generateReactWrapper(options.analysis);
    },
  };
};

export const generateReactWrapper = async (
  analysis: Package
): Promise<FileTree> => {
  const litModules: LitModule[] = getLitModules(analysis);
  if (litModules.length > 0) {
    // Base the generated package folder name off the analyzed package folder
    // name, not the npm package name, since that might have an npm org in it
    const reactPkgFolder = packageNameToReactPackageName(
      path.basename(analysis.rootDir)
    );
    return {
      [reactPkgFolder]: {
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
        react: '^17 || ^18',
        '@types/react': '^17 || ^18',
      },
      devDependencies: {
        // Use typescript from source package, assuming it exists
        typescript: pkgJson?.devDependencies?.typescript ?? '~4.3.5',
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

const wrapperTemplate = ({name, tagname, events}: LitElementDeclaration) => {
  return javascript`
export const ${name} = createComponent(
  React,
  '${tagname}',
  ${name}Element,
  {
    ${Array.from(events.keys()).map(
      (eventName) => javascript`
    ${kabobToOnEvent(eventName)}: '${
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
