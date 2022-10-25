import vue from '@vitejs/plugin-vue';

// https://vitejs.dev/config/
export default {
  build: {
    lib: {
      entry: './src/tests/test-element-a_test.ts',
      fileName: () => `test-element-a_test.js`,
      formats: ['es'],
      sourcemaps: false,
    },
    outDir: './tests',
    sourcemaps: false,
  },
  plugins: [vue()],
};
