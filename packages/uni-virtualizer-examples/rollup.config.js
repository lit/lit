/**
 * @license
 * Copyright (c) 2020 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at
 * http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at
 * http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */


import babel from 'rollup-plugin-babel';
import commonjs from 'rollup-plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';
// import {terser} from 'rollup-plugin-terser';
import filesize from 'rollup-plugin-filesize';
import minifyHTML from 'rollup-plugin-minify-html-literals';
// import copy from 'rollup-plugin-copy';

const babelConfig = {
  babelrc: false,
  ...{
    presets: [
      [
        '@babel/preset-env',
        {
          targets: {
            ie: '11',
          }
        }
      ],
    ],
  },
};

const terserConfig = {
  output: {
    comments: function(_, comment) {
      const text = comment.value;
      const type = comment.type;
      if (type == 'comment2') {
        // multiline comment
        return /@preserve|@license|@cc_on/i.test(text);
      }
    },
  },
};

const filesizeConfig = {
  showGzippedSize: true,
  showBrotliSize: false,
  showMinifiedSize: false,
};

const copyConfig = {
  targets: [
    { src: 'node_modules/@webcomponents', dest: 'build/node_modules' }
  ]
};

const samples = [
  'basic-lit-element',
  'basic-lit-html',
  'scroll-to-index-lit-element',
  'scroll-to-index-lit-html',
  'visible-indices-lit-element',
  'visible-indices-lit-html',
  'photo-grid-lit-html'
];

let configs = [
  // Babel polyfills for older browsers that don't support ES2015+.
  {
    input: 'babel-polyfills.js',
    output: {
      file: 'public/shared/build/system-transpiled/babel-polyfills.js',
      format: 'system',
    },
    plugins: [
      commonjs(),
      resolve(),
    ],
  }
];

const perSampleConfigs = (sample) => [
  // The main JavaScript bundle for modern browsers that support
  // JavaScript modules and other ES2015+ features.
  {
    input: `public/${sample}/index.js`,
    output: {
      dir: `public/${sample}/build/es`,
      format: 'es',
    },
    plugins: [minifyHTML(), resolve()],
  }, 
  // The main JavaScript bundle for pre-Chromium Edge
  {
    input: `public/${sample}/index.js`,
    output: {
      dir: `public/${sample}/build/system`,
      format: 'system',
    },
    plugins: [
      minifyHTML(),
      resolve(),
      // copy(copyConfig)
    ],
  },
  // The main JavaScript bundle for IE11
  {
    input: `public/${sample}/index.js`,
    output: {
      dir: `public/${sample}/build/system-transpiled`,
      format: 'system',
    },
    plugins: [
      minifyHTML(),
      commonjs({include: ['node_modules/**']}),
      babel(babelConfig),
      resolve(),
      // copy(copyConfig)
    ],
  },
];

samples.forEach(sample => {
  configs = configs.concat(perSampleConfigs(sample));
});

for (const config of configs) {
  // if (process.env.NODE_ENV !== 'development') {
  //   config.plugins.push(terser(terserConfig));
  // }
  config.plugins.push(filesize(filesizeConfig));
}

export default configs;

// import resolve from 'rollup-plugin-node-resolve';
// import babel from 'rollup-plugin-babel';
// import commonjs from '@rollup/plugin-commonjs';

// export default [
//   {
//     input: 'public/basic-lit-html/index.js',
//     output: {
//       dir: 'public/basic-lit-html/build',
//       format: 'system'
//     },
//     plugins: [
//       resolve(),
//       commonjs(),
//       babel({
//         babelrc: false,
//         runtimeHelpers: true,
//         exclude: [/\/core-js\//, /\/webcomponentsjs\//],
//           "presets": [
//             ["@babel/env", {
//                 "targets": "> 0.25%, not dead, IE 11",
//                 "modules": false,
//                 "useBuiltIns": "entry",
//                 "corejs": {"version": 3, "proposals": true}
//                 }]
//           ],
//           "plugins": [
//               "@babel/plugin-transform-runtime",
//               "@babel/plugin-transform-classes"
//           ]
//       })
//     ] 
//   },
//   {
//     input: 'public/basic-lit-element/index.js',
//     output: {
//       dir: 'public/basic-lit-element/build',
//       format: 'esm'
//     },
//     plugins: [
//       resolve(),
//     ]
//   },
//   {
//     input: 'public/scroll-to-index-lit-html/index.js',
//     output: {
//       dir: 'public/scroll-to-index-lit-html/build',
//       format: 'esm'
//     },
//     plugins: [
//       resolve(),
//     ]
//   },
//   {
//     input: 'public/scroll-to-index-lit-element/index.js',
//     output: {
//       dir: 'public/scroll-to-index-lit-element/build',
//       format: 'esm'
//     },
//     plugins: [
//       resolve(),
//     ]
//   },
//   {
//     input: 'public/visible-indices-lit-html/index.js',
//     output: {
//       dir: 'public/visible-indices-lit-html/build',
//       format: 'esm'
//     },
//     plugins: [
//       resolve(),
//     ]
//   },
//   {
//     input: 'public/visible-indices-lit-element/index.js',
//     output: {
//       dir: 'public/visible-indices-lit-element/build',
//       format: 'esm'
//     },
//     plugins: [
//       resolve(),
//     ]
//   },
//   {
//     input: 'public/photo-grid-lit-html/index.js',
//     output: {
//       dir: 'public/photo-grid-lit-html/build',
//       format: 'esm'
//     },
//     plugins: [
//       resolve(),
//     ]
//   },
// ];