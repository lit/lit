import {LitModule, PackageJson} from '@lit-labs/analyzer/lib/model.js';
import {
  javascript,
  kabobToPascalCase,
} from '@lit-labs/gen-utils/lib/str-utils.js';

const pkgShortName = (str: string) => str.substring(str.lastIndexOf('/') + 1);

/**
 * Generates a Vite config.
 *
 * Note, ideally we would be using Vite library mode instead of configuring
 * the `rollupOptions` manually. However, Vite supports only a single entry
 * file in that case, and this generator supports multiple modules.
 *
 * See https://github.com/vitejs/vite/discussions/1736.
 */
export const viteConfigTemplate = (
  pkgJson: PackageJson,
  litModules: LitModule[]
) => {
  // TODO(sorvell): This name is used to generate a UMD global name, but it
  // should be per-output module. It doesn't seem like rollup has a way to
  // configure output name per output module.
  const name = kabobToPascalCase(pkgShortName(pkgJson.name || 'MyPackage'));
  return javascript`
import vue from '@vitejs/plugin-vue';
import typescript from '@rollup/plugin-typescript';

// https://vitejs.dev/config/
export default {
  build: {
    rollupOptions: {
      external: () => true,
      input: [
        ${litModules.map(({module}) => `'./${module.sourcePath}'`).join(', ')}
      ],
      preserveModules: true,
      preserveEntrySignatures: true,
      output: [
        {
          format: 'es',
          entryFileNames: ({ name }) => \`\${name}.js\`,
          dir: './',
          sourcemap: true
        },
        {
          format: 'umd',
          name: '${name}',
          entryFileNames: ({ name }) => \`\${name}.umd.js\`,
          globals: {
            vue: 'Vue'
          },
          dir: './',
          sourcemap: true
        },
      ]
    },
    outDir: './'
  },
  plugins: [vue(), typescript()],
};`;
};
