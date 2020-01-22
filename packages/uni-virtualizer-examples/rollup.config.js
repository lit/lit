import resolve from 'rollup-plugin-node-resolve';

export default [
  {
    input: 'public/temp/index.js',
    output: {
      dir: 'public/temp/build',
      format: 'esm'
    },
    plugins: [
      resolve(),
    ]
  },
  {
    input: 'public/experimental/index.js',
    output: {
      dir: 'public/experimental/build',
      format: 'esm'
    },
    plugins: [
      resolve(),
    ]
  },
  {
    input: 'public/basic-lit-html/index.js',
    output: {
      dir: 'public/basic-lit-html/build',
      format: 'esm'
    },
    plugins: [
      resolve(),
    ]        
  },
  {
    input: 'public/basic-lit-element/index.js',
    output: {
      dir: 'public/basic-lit-element/build',
      format: 'esm'
    },
    plugins: [
      resolve(),
    ]
  },
  {
    input: 'public/scroll-to-index-lit-html/index.js',
    output: {
      dir: 'public/scroll-to-index-lit-html/build',
      format: 'esm'
    },
    plugins: [
      resolve(),
    ]
  },
  {
    input: 'public/scroll-to-index-lit-element/index.js',
    output: {
      dir: 'public/scroll-to-index-lit-element/build',
      format: 'esm'
    },
    plugins: [
      resolve(),
    ]
  },
  {
    input: 'public/visible-indices-lit-html/index.js',
    output: {
      dir: 'public/visible-indices-lit-html/build',
      format: 'esm'
    },
    plugins: [
      resolve(),
    ]
  },
  {
    input: 'public/visible-indices-lit-element/index.js',
    output: {
      dir: 'public/visible-indices-lit-element/build',
      format: 'esm'
    },
    plugins: [
      resolve(),
    ]
  },
  {
    input: 'public/photo-grid-lit-html/index.js',
    output: {
      dir: 'public/photo-grid-lit-html/build',
      format: 'esm'
    },
    plugins: [
      resolve(),
    ]
  },
];