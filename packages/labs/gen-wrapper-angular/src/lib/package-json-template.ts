/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {
  ModuleWithLitElementDeclarations,
  PackageJson,
} from '@lit-labs/analyzer/lib/model.js';

export const packageJsonTemplate = (
  angularPackageName: string,
  packageJson: PackageJson,
  litModules: ModuleWithLitElementDeclarations[]
) => {
  // Refinement of package.json generation ala the TODOs below tracked in
  // https://github.com/lit/lit/issues/2855

  // TODO(kschaaf): spread in/adapt other relevant fields from source
  // package.json (description, license, keywords, etc.)
  return JSON.stringify(
    {
      name: angularPackageName,
      type: 'module',
      scripts: {
        build: 'tsc',
        'build:watch': 'tsc --watch',
      },
      // TODO(kschaaf): Version in lock-step with source?
      version: packageJson.version,
      dependencies: {
        [packageJson.name as string]: '^' + packageJson.version,
        tslib: '^2.8.1',
      },
      peerDependencies: {
        '@angular/common': '^20.0.1',
        '@angular/core': '^20.0.1',
      },
      devDependencies: {
        '@angular/core': '^20.0.1',
        '@angular/common': '^20.0.1',
        '@angular/compiler': '^20.0.1',
        '@angular/compiler-cli': '^20.0.1',
        'ng-packagr': '^20.0.1',
        typescript: '~5.8.0',
      },
      files: [
        ...litModules.map(({module}) => module.sourcePath.replace(/\\/g, '/')),
      ],
    },
    null,
    2
  );
};
