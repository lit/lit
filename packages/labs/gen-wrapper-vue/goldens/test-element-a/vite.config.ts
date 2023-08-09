import vue from '@vitejs/plugin-vue';
import typescript from '@rollup/plugin-typescript';
import path from 'path';

// https://vitejs.dev/config/
export default {
  build: {
    rollupOptions: {
      // Ensures no deps are bundled with build.
      // Source paths are expected to start with `./` or `/` but may be
      // `x:` on Windows.
      external: (id: string) => !id.match(/^((\w:)|(\.?[\\/]))/),
      input: [
        './src/ElementA.vue',
        './src/ElementEvents.vue',
        './src/ElementProps.vue',
        './src/ElementSlots.vue',
        './src/sub/ElementSub.vue',
      ],
      preserveModules: false,
      preserveEntrySignatures: true,
      output: {
        format: 'es',
        // For subpath component, we should output it in subpath.
        // Otherwise, if there are files with the same file name in the subPath and rootPath,
        // output to the same directory will conflict.
        entryFileNames: ({name, facadeModuleId}) => {
          const sourceFileDir = path.dirname(facadeModuleId);
          const relativePath = path.relative(__dirname, sourceFileDir);
          const targetName = path
            .join(relativePath, `${name}.js`)
            .replace(/\\/g, '/')
            .replace(/^src\//, '');
          return targetName;
        },
        dir: './',
        sourcemap: true,
      },
    },
    outDir: './',
  },
  plugins: [vue(), typescript()],
};
