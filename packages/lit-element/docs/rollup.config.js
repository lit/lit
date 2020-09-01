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
import {terser} from 'rollup-plugin-terser';
import filesize from 'rollup-plugin-filesize';
import minifyHTML from 'rollup-plugin-minify-html-literals';
import copy from 'rollup-plugin-copy';

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

const configs = [
  // The main JavaScript bundle for modern browsers that support
  // JavaScript modules and other ES2015+ features.
  {
    input: 'src/index.js',
    output: {
      file: 'build/bundle.js',
      format: 'es',
    },
    plugins: [minifyHTML(), resolve()],
  }, 
  // The main JavaScript bundle for older browsers that don't support
  // JavaScript modules or ES2015+.
  {
    input: ['src/index.js'],
    output: {
      file: 'build/bundle-nomodule.js',
      format: 'iife',
    },
    plugins: [
      minifyHTML(),
      commonjs({include: ['node_modules/**']}),
      babel(babelConfig),
      resolve(),
      copy(copyConfig)
    ],
  },
  // Babel polyfills for older browsers that don't support ES2015+.
  {
    input: 'src/babel-polyfills-nomodule.js',
    output: {
      file: 'build/babel-polyfills-nomodule.js',
      format: 'iife',
    },
    plugins: [
      commonjs({include: ['node_modules/**']}),
      resolve(),
    ],
  },
];

for (const config of configs) {
  if (process.env.NODE_ENV !== 'development') {
    config.plugins.push(terser(terserConfig));
  }
  config.plugins.push(filesize(filesizeConfig));
}

export default configs;
