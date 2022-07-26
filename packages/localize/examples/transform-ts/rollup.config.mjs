import typescript from '@rollup/plugin-typescript';
import resolve from '@rollup/plugin-node-resolve';
import {terser} from 'rollup-plugin-terser';
import {summary} from 'rollup-plugin-summary';
import {localeTransformers} from '@lit/localize-tools/lib/rollup.js';

const locales = localeTransformers();

export default locales.map(({locale, localeTransformer}) => ({
  input: `src/index.ts`,
  plugins: [
    typescript({
      transformers: {
        before: [localeTransformer],
      },
    }),
    resolve(),
    terser(),
    summary({
      showBrotliSize: true,
      showGzippedSize: true,
    }),
  ],
  output: {
    file: `bundled/${locale}/index.js`,
    format: 'es',
    sourcemap: true,
  },
}));
