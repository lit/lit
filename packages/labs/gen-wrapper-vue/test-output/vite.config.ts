import vue from '@vitejs/plugin-vue';
import {defineConfig} from 'vite';

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    target: 'esnext',
    lib: {
      entry: './src/tests/tests.ts',
      fileName: () => `tests.js`,
      formats: ['es'],
    },
    outDir: './tests',
  },
  plugins: [vue()],
});
