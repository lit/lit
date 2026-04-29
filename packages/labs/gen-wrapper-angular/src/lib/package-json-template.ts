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
        [packageJson.name!]: '^' + packageJson.version!,
      },
      peerDependencies: {
        '@angular/common': '^13.3.0',
        '@angular/core': '^13.3.0',
      },
      devDependencies: {
        // Use typescript from source package, assuming it exists
        typescript: packageJson?.devDependencies?.typescript ?? '~4.7.4',
      },
      files: [
        ...litModules.map(({module}) => module.jsPath.replace(/\\/g, '/')),
      ],
    },
    null,
    2
  );
};
