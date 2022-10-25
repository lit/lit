import vue from '@vitejs/plugin-vue';

// https://vitejs.dev/config/
export default {
  build: {
    rollupOptions: {
      preserveModules: false,
    },
    lib: {
      entry: './src/tests/test-element-a_test.ts',
      fileName: () => `test-element-a_test.js`,
      formats: ['es'],
    },
    outDir: './tests',
  },
  plugins: [vue()],
};
