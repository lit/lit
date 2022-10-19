import vue from '@vitejs/plugin-vue';
import typescript from '@rollup/plugin-typescript';

// https://vitejs.dev/config/
export default {
  build: {
    rollupOptions: {
      // Ensures no deps are bundled with this build.
      external: (id: string) => !!id.match(/^(vue|@lit.*|lit)$/),
      input: [
        './src/ElementA.vue',
        './src/ElementEvents.vue',
        './src/ElementProps.vue',
        './src/ElementSlots.vue',
      ],
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
