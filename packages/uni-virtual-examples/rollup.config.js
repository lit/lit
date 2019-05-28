import resolve from 'rollup-plugin-node-resolve';
// import { terser } from 'rollup-plugin-terser';

export default [
  {
    input: [
        'lit-html',
        'lit-element',
        'lit-virtual/src/lit-virtual-scroller.js',
        'public/temp/index.js'
      ],
      output: {
        dir: 'public/temp/build',
        format: 'esm'
      },
      plugins: [
        resolve(),
        // terser()
      ]        
  },
  {
    input: [
        'lit-html',
        'lit-virtual/src/scroll.js',
        'public/basic-lit-html/index.js'
      ],
      output: {
        dir: 'public/basic-lit-html/build',
        format: 'esm'
      },
      plugins: [
        resolve(),
        // terser()
      ]        
  },
  {
    input: [
        'lit-element',
        'lit-virtual/src/lit-virtual-scroller.js',
        'public/basic-lit-element/index.js'
      ],
      output: {
        dir: 'public/basic-lit-element/build',
        format: 'esm'
      },
      plugins: [
        resolve(),
        // terser()
      ]
  },
];