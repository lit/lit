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

import summary from 'rollup-plugin-summary';
import {terser} from 'rollup-plugin-terser';
import copy from 'rollup-plugin-copy';
import * as pathLib from 'path';
import sourcemaps from 'rollup-plugin-sourcemaps';
import replace from '@rollup/plugin-replace';
import { nodeResolve } from '@rollup/plugin-node-resolve';

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

const moduleEntryPoints = [
  'lit-element',
  'lib/updating-element',
  'lib/css-tag',
  'lib/decorators',
  'lib/decorators/base',
  'lib/decorators/customElement',
  'lib/decorators/eventOptions',
  'lib/decorators/internalProperty',
  'lib/decorators/property',
  'lib/decorators/query',
  'lib/decorators/queryAll',
  'lib/decorators/queryAssignedNodes',
  'lib/decorators/queryAsync',
];

const nonModuleEntryPoints = [
  'lib/polyfill'
];

const generateConfig = (entryPoints, noModule) => {
  return {
    input: entryPoints.map((name) => `development/${name}.js`),
    external: ['lit-html'],
    output: {
      dir: noModule ? './lib' : './',
      format: noModule ? 'iife' : 'esm',
      // Preserve existing module structure (e.g. preserve the "decorators/"
      // directory).
      preserveModules: !noModule,
      sourcemap: !CHECKSIZE,
    },
    plugins: [
      noModule ? nodeResolve() : null,
      // Switch all DEV_MODE variable assignment values to false. Terser's dead
      // code removal will then remove any blocks that are conditioned on this
      // variable.
      //
      // Code in our development/ directory looks like this:
      //
      //   const DEV_MODE = true;
      //   if (DEV_MODE) { // dev mode stuff }
      //
      // Note we want the transformation to `goog.define` syntax for Closure
      // Compiler to be trivial, and that would look something like this:
      //
      //   const DEV_MODE = goog.define('lit-html.DEV_MODE', false);
      //
      // We can't use terser's compress.global_defs option, because it won't
      // replace the value of a variable that is already defined in scope (see
      // https://github.com/terser/terser#conditional-compilation). It seems to be
      // designed assuming that you are _always_ using terser to set the def one
      // way or another, so it's difficult to define a default in the source code
      // itself.
      replace({
        'const DEV_MODE = true': 'const DEV_MODE = false',
      }),
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
      summary(),
      ...(CHECKSIZE
        ? [skipBundleOutput]
        : noModule ?
        // Place the bundled version into development so the build works.
        [copy({
          hook: 'writeBundle',
          targets: entryPoints.map((name) => ({
            src: `${name}.js`,
            dest: pathLib.dirname(`development/${name}`),
          }))
        })]
        : [
            // Place a copy of each d.ts file adjacent to its minified module.
            copy({
              targets: entryPoints.map((name) => ({
                src: `development/${name}.d.ts`,
                dest: pathLib.dirname(name),
              }))
            }),
            // Copy the tests.
            copy({
              targets: [{
                src: `src/test/polyfill/*_test.html`,
                dest: ['development/test/polyfill', 'test/polyfill'],
              }]
            }),
          ]),
      ],
  }
}

export default [
  generateConfig(moduleEntryPoints),
  generateConfig(nonModuleEntryPoints, true)
];
