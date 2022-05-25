import vue from '@vitejs/plugin-vue';
import typescript from '@rollup/plugin-typescript';

// https://vitejs.dev/config/
export default {
  build: {
    rollupOptions: {
      external: () => true,
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
