import commonjs from '@rollup/plugin-commonjs';
import {createRequire} from 'module';

const require = createRequire(import.meta.url);
const typescriptLibPath = require.resolve('typescript/lib/typescript.js');

/**
 * This Rollup config generates a JS module version of typescript from its
 * CommonJS version.
 */
export default [
  {
    input: typescriptLibPath,
    output: {
      file: 'test/browser/typescript.js',
      format: 'esm',
    },
    plugins: [
      commonjs({
        ignore: (_id) => true,
      }),
    ],
  },
];
