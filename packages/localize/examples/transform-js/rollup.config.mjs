import typescript from '@rollup/plugin-typescript';
import resolve from '@rollup/plugin-node-resolve';
import {terser} from 'rollup-plugin-terser';
import {summary} from 'rollup-plugin-summary';
import {localeTransformers} from '@lit/localize-tools/lib/rollup.js';

const locales = localeTransformers();

export default locales.map(({locale, localeTransformer}) => ({
  input: `src/index.js`,
  plugins: [
    typescript({
      transformers: {
        before: [localeTransformer],
      },
      // Specifies the ES version and module format to emit.
      tsconfig: 'jsconfig.json',
      // Temporary directory where transformed modules will be emitted before
      // Rollup bundles them.
      outDir: 'bundled/temp',
      // @rollup/plugin-typescript always matches only ".ts" files, regardless
      // of any settings in our jsconfig.json.
      include: ['src/**/*.js'],
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
