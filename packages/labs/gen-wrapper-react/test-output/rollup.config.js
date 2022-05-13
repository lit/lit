import {nodeResolve} from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import replace from '@rollup/plugin-replace';
export default {
  input: ['js/tests/test-element-a_test.js'],
  output: {
    dir: './tests',
    format: 'esm',
    sourcemap: true,
  },
  plugins: [
    nodeResolve({
      extensions: ['.js'],
    }),
    replace({
      'process.env.NODE_ENV': JSON.stringify('development'),
    }),
    commonjs(),
  ],
};
