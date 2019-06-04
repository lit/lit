import resolve from 'rollup-plugin-node-resolve';

// rollup must use output dir, not output file, because there are dynamic imports in the
// build. E.g. importing Layout1d and the conditional polyfill loading.
// PSYCH check out dat --inlineDynamicImports flag.
export default [
  {
    input: [
      'lit-virtual.js'
    ],
    output: {
      name: 'why',
      file: 'lit-virtual.bundled.js',
      format: 'iife'
    },
    plugins: [
      resolve(),
    ],
    inlineDynamicImports: true,
  },
];