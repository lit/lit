/**
 * @license
 * Copyright (c) 2018 The Polymer Project Authors. All rights reserved.
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

import compiler from '@ampproject/rollup-plugin-closure-compiler';
import filesize from 'rollup-plugin-filesize';
import typescript from 'rollup-plugin-typescript2';

export default [
  {
    input: 'src/lit-html.ts',
    output: {
      file: 'dist/lit-html.js',
      format: 'es'
    },
    plugins: [typescript({
      tsconfigOverride: {include: ['src']}
    }), filesize({
      showBrotliSize: true,
    })]
  },
  {
    input: 'dist/lit-html.js',
    output: {
      file: 'dist/lit-html.bundled.js',
      format: 'es'
    },
    plugins: [
      compiler({
        compilation_level: 'ADVANCED',
        language_in: 'ECMASCRIPT_2015',
        language_out: 'ECMASCRIPT_2015',
        formatting: 'PRETTY_PRINT'
      }),
      filesize({
        showBrotliSize: true,
      })
    ]
  }
];
