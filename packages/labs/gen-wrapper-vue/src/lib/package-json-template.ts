/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {PackageJson} from '@lit-labs/analyzer/lib/model.js';

export const packageJsonTemplate = (
  pkgJson: PackageJson,
  moduleNames: string[]
) => {
  // Refinement of package.json generation ala the TODOs below tracked in
  // https://github.com/lit/lit/issues/2855

  // TODO(kschaaf): spread in/adapt other relevant fields from source
  // package.json (description, license, keywords, etc.)
  return JSON.stringify(
    {
      name: `${pkgJson.name}-vue`,
      type: 'module',
      // Use vite!
      scripts: {
        dev: 'vite',
        build: 'npm run build:declarations && vite build',
        typecheck: 'vue-tsc --noEmit',
        'build:declarations': 'vue-tsc --declaration --emitDeclarationOnly',
        preview: 'vite preview',
      },
      // TODO(kschaaf): Version in lock-step with source?
      version: pkgJson.version,
      dependencies: {
        // TODO(kschaaf): make component version range configurable?
        [pkgJson.name!]: '^' + pkgJson.version!,
        vue: '^3.2.41',
        '@lit-labs/vue-utils': '^0.1.0',
      },
      devDependencies: {
        // Use typescript from source package, assuming it exists
        typescript: pkgJson?.devDependencies?.typescript ?? '~5.5.0',
        '@vitejs/plugin-vue': '^5.0.5',
        '@rollup/plugin-typescript': '^11.1.6',
        vite: '^5.3.1',
        'vue-tsc': '^2.0.22',
      },
      files: [...moduleNames.map((f) => `${f}.*`)],
    },
    null,
    2
  );
};
