import resolve from 'rollup-plugin-node-resolve';

export default [
  {
    input: [
        'lit-html',
        'lit-element',
        'lit-virtualizer/lib/lit-virtualizer.js',
        'public/temp/index.js'
      ],
      output: {
        dir: 'public/temp/build',
        format: 'esm'
      },
      plugins: [
        resolve(),
      ]        
  },
  {
    input: [
        'lit-html',
        'lit-virtualizer/lib/scroll.js',
        'public/basic-lit-html/index.js'
      ],
      output: {
        dir: 'public/basic-lit-html/build',
        format: 'esm'
      },
      plugins: [
        resolve(),
      ]        
  },
  {
    input: [
        // 'lit-element',
        // 'lit-virtualizer/src/lit-virtualizer.js',
        'public/basic-lit-element/index.js'
      ],
      output: {
        dir: 'public/basic-lit-element/build',
        format: 'esm'
      },
      plugins: [
        resolve(),
      ]
  },
];