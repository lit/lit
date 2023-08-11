import vue from '@vitejs/plugin-vue';
import typescript from '@rollup/plugin-typescript';

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
      preserveModules: true,
      preserveModulesRoot: 'src',
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
