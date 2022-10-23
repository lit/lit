import vue from '@vitejs/plugin-vue';
import typescript from '@rollup/plugin-typescript';

// https://vitejs.dev/config/
export default {
  build: {
    rollupOptions: {
      // Ensures no deps are bundled with build.
      // Source paths are expected to start with `./` or `/`.
      external: (id: string, parent: string, isResolved: boolean) =>
        !isResolved && !id.match(/^\.?\//),
      input: ['./src/ElementA.vue'],
      preserveModules: true,
      preserveEntrySignatures: true,
      output: {
        format: 'es',
        entryFileNames: ({name}) => `${name}.js`,
        dir: './',
        sourcemap: true,
      },
    },
    outDir: './',
  },
  plugins: [vue(), typescript()],
};
