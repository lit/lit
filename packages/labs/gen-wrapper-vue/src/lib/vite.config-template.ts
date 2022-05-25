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
 * TODO(sorvell): We may want to also generate umd output, but it's unclear if
 * we need to do so. The code below can be added for umd generation:
 *
 * 1. We need to name the UMD output, but it should be per-output module. It
 * doesn't seem like rollup has a way to configure output name per output
 * module.
 *
 * const pkgShortName = (str: string) => str.substring(str.lastIndexOf('/') + 1);
 * const name = kabobToPascalCase(pkgShortName(pkgJson.name || 'MyPackage'));
 *
 * 2. The rollupOptions output section can be converted to an array with this
 * block added for umd generation:
 *
 * {
 *   format: 'umd',
 *   name: '${name}',
 *   entryFileNames: ({ name }) => \`\${name}.umd.js\`,
 *   globals: {
 *     vue: 'Vue'
 *   },
 *   dir: './',
 *   sourcemap: true
 * },
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
      external: () => true,
      input: [
        ${Object.keys(sfcFiles)
          .map((path) => `'./${path}'`)
          .join(', ')}
      ],
      preserveModules: true,
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
