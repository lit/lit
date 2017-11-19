export default [
  {
    input: 'lit-html.js',
    output: {
      file: 'dist/es/lit-html.js',
      format: 'es',
      name: 'Lit',
    },
    sourcemap: true,
  },
  {
    input: 'lib/lit-extended.js',
    output: {
      file: 'dist/es/lit-extended.js',
      format: 'es',
      name: 'Lit',
    },
    sourcemap: true,
  },
  {
    input: 'lit-html.js',
    output: {
      file: 'dist/script/lit-html.js',
      format: 'iife',
      name: 'Lit',
    },
    sourcemap: true,
  },
  {
    input: 'lib/lit-extended.js',
    output: {
      file: 'dist/script/lit-extended.js',
      format: 'iife',
      name: 'Lit',
    },
    sourcemap: true,
  }
];