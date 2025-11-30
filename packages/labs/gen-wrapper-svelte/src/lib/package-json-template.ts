/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {PackageJson} from '@lit-labs/analyzer/lib/model.js';

export const packageJsonTemplate = (pkgJson: PackageJson) => {
  // Refinement of package.json generation ala the TODOs below tracked in
  // https://github.com/lit/lit/issues/2855

  // TODO(kschaaf): spread in/adapt other relevant fields from source
  // package.json (description, license, keywords, etc.)
  return JSON.stringify(
    {
      name: `${pkgJson.name}-svelte`,
      version: pkgJson.version,
      scripts: {
        dev: 'vite dev',
        build: 'vite build && npm run prepack',
        preview: 'vite preview',
        prepare: "svelte-kit sync || echo ''",
        prepack: 'svelte-kit sync && svelte-package && publint',
        check: 'svelte-kit sync && svelte-check --tsconfig ./tsconfig.json',
        'check:watch':
          'svelte-kit sync && svelte-check --tsconfig ./tsconfig.json --watch',
      },
      files: ['dist', '!dist/**/*.test.*', '!dist/**/*.spec.*'],
      sideEffects: ['**/*.css'],
      svelte: './dist/index.js',
      types: './dist/index.d.ts',
      type: 'module',
      exports: {
        '.': {
          types: './dist/index.d.ts',
          svelte: './dist/index.js',
        },
      },
      dependencies: {
        [pkgJson.name!]: '^' + pkgJson.version!,
      },
      peerDependencies: {
        svelte: '^5.0.0',
      },
      devDependencies: {
        '@sveltejs/adapter-auto': '^7.0.0',
        '@sveltejs/kit': '^2.48.5',
        '@sveltejs/package': '^2.5.6',
        '@sveltejs/vite-plugin-svelte': '^6.2.1',
        publint: '^0.3.15',
        svelte: '^5.43.8',
        'svelte-check': '^4.3.4',
        typescript: '^5.9.3',
        vite: '^7.2.2',
      },
      keywords: ['svelte'],
    },
    null,
    2
  );
};
