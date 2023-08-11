/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {PackageJson} from '@lit-labs/analyzer/lib/model.js';
import {FileTree} from '@lit-labs/gen-utils/lib/file-utils.js';
import {javascript} from '@lit-labs/gen-utils/lib/str-utils.js';

/**
 * Generates a Vite config.
 *
 * Note, ideally we would be using Vite library mode instead of configuring
 * the `rollupOptions` manually. However, Vite supports only a single entry
 * file in that case, and this generator supports multiple modules.
 *
 * See https://github.com/vitejs/vite/discussions/1736.
 *
 */
export const viteConfigTemplate = (
  _pkgJson: PackageJson,
  sfcFiles: FileTree
) => javascript`
import vue from '@vitejs/plugin-vue';
import typescript from '@rollup/plugin-typescript';

// https://vitejs.dev/config/
export default {
  build: {
    rollupOptions: {
      // Ensures no deps are bundled with build.
      // Source paths are expected to start with \`./\` or \`/\` but may be
      // \`x:\` on Windows.
      external: (id: string) => !id.match(/^((\\w:)|(\\.?[\\\\/]))/),
      input: [
        ${Object.keys(sfcFiles)
          .map((path) => `'./${path.replace(/\\/g, '/')}'`)
          .join(', ')}
      ],
      preserveModules: true,
			preserveModulesRoot: 'src',
      preserveEntrySignatures: true,
      output: {
        format: 'es',
        entryFileNames: ({ name }) => \`\${name}.js\`,
        dir: './',
        sourcemap: true
      }
    },
    outDir: './'
  },
  plugins: [vue(), typescript()],
};`;
