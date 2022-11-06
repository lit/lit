import vue from '@vitejs/plugin-vue';

// https://vitejs.dev/config/
export default {
  build: {
    lib: {
      entry: './src/tests/tests.ts',
      fileName: () => `tests.js`,
      formats: ['es'],
    },
    outDir: './tests',
  },
  plugins: [vue()],
};
