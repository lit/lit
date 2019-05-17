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
    }
];