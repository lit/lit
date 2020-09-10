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

import filesize from 'rollup-plugin-filesize';
import {terser} from 'rollup-plugin-terser';
import copy from 'rollup-plugin-copy';
import * as pathLib from 'path';
import sourcemaps from 'rollup-plugin-sourcemaps';

const entryPoints = ['lit-html', 'directives/if-defined'];

export default {
  input: entryPoints.map((name) => `development/${name}.js`),
  output: {
    dir: './',
    format: 'esm',
    preserveModules: true,
    sourcemap: true,
  },
  plugins: [
    // This plugin automatically composes the existing TypeScript -> raw JS
    // sourcemap with the raw JS -> minified JS one that we're generating here.
    sourcemaps(),
    terser({
      warnings: true,
      ecma: 2017,
      compress: {
        unsafe: true,
        // An extra pass can squeeze out an extra byte or two.
        passes: 2,
      },
      output: {
        comments: 'some', // preserves @license and @preserve
        inline_script: false,
        // TODO (justinfagnani): benchmark
        // wrap_func_args: false,
      },
      mangle: {
        properties: {
          regex: /^__/,
        },
      },
    }),
    copy({
      targets: entryPoints.map((name) => ({
        src: `development/${name}.d.ts`,
        dest: pathLib.dirname(name),
      })),
    }),
    filesize({
      showMinifiedSize: false,
      showBrotliSize: true,
    }),
  ],
};
