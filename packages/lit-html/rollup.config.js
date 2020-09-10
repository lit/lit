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

// In CHECKSIZE mode we:
// 1) Don't emit any files.
// 2) Don't include copyright header comments.
// 3) Don't include the "//# sourceMappingURL" comment.
const CHECKSIZE = !!process.env.CHECKSIZE;
if (CHECKSIZE) {
  console.log('NOTE: In CHECKSIZE mode, no output!');
}

const skipBundleOutput = {
  generateBundle(options, bundles) {
    // Deleting all bundles from this object prevents them from being written,
    // see https://rollupjs.org/guide/en/#generatebundle.
    for (const name in bundles) {
      delete bundles[name];
    }
  },
};

const entryPoints = ['lit-html', 'directives/if-defined'];

export default {
  input: entryPoints.map((name) => `development/${name}.js`),
  output: {
    dir: './',
    format: 'esm',
    // Preserve existing module structure (e.g. preserve the "directives/"
    // directory).
    preserveModules: true,
    sourcemap: !CHECKSIZE,
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
        // "some" preserves @license and @preserve comments
        comments: CHECKSIZE ? false : 'some',
        inline_script: false,
      },
      mangle: {
        properties: {
          regex: /^__/,
        },
      },
    }),
    filesize({
      showMinifiedSize: false,
      showBrotliSize: true,
    }),
    ...(CHECKSIZE
      ? [skipBundleOutput]
      : [
          // Place a copy of each d.ts file adjacent to its minified module.
          copy({
            targets: entryPoints.map((name) => ({
              src: `development/${name}.d.ts`,
              dest: pathLib.dirname(name),
            })),
          }),
        ]),
  ],
};
