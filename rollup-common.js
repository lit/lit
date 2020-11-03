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
import nodeResolve from '@rollup/plugin-node-resolve';
import * as pathLib from 'path';
import sourcemaps from 'rollup-plugin-sourcemaps';
import replace from '@rollup/plugin-replace';
import virtual from '@rollup/plugin-virtual';

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

const reservedProperties = [
  '_$litType$',
  '_$litDirective$',
  // TODO Decide on public API
  // https://github.com/Polymer/lit-html/issues/1261
  '_value',
  '_setValue',
  'createTreeWalker',
  // TODO(sorvell): The properties below are only reserved so dev and prod can
  // work together x-package.
  // Note, reserved so that prod updating-element platform-support
  // can share this key with dev lit-element platform-support which
  // imports it.
  '_handlesPrepareStyles',
  // TODO(kschaaf) TBD: lit-ssr required "private" fields (can be in
  // crossPackagePropertyMangles once lit-ssr uses the rollup config)
  // lit-html: AttributePart (used by render-lit-html)
  '_commitValue',
  // lit-html: Directive (used by render-lit-html)
  '_resolve',
  // updating-element: UpdatingElement (used by lit-element-renderer)
  '_attributeToProperty',
  // hydrate-support: LitElement (added by hydrate-support)
  '_needsHydration',
];

// Any private properties which we share between different _packages_ are
// hard-coded here because they must never change between versions. Mangled
// names are uppercase letters, in case we ever might want to
// use lowercase letters for short, public APIs.
// Note, these are used for `platform-support`.
const crossPackagePropertyMangles = {
  // lit-html: Template
  _createElement: 'A',
  _element: 'B',
  _options: 'C',
  // lit-html: NodePart
  _startNode: 'D',
  _endNode: 'E',
  _getTemplate: 'F',
  // lit-html: TemplateInstance
  _template: 'H',
  // lit-element: LitElement
  _renderOptions: 'W',
  _controllers: 'X',
  // lit-element: LitElement (used by hydrate-support)
  _renderImpl: 'M',
};

const generateTerserOptions = (nameCache = null) => ({
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
  nameCache,
  mangle: {
    properties: {
      regex: /^_/,
      reserved: reservedProperties,
      // Set to true to mangle to readable names
      debug: false,
    },
  },
});

export function litProdConfig({
  entryPoints,
  external = [],
  bundled = [],
  // eslint-disable-next-line no-undef
} = options) {
  // The Terser shared name cache allows us to mangle the names of properties
  // consistently across modules, so that e.g. parts.js can safely access internal
  // details of lit-html.js.
  //
  // However, we still have to account for the problem of mangled names getting
  // re-used for different properties across files, because Terser does not
  // consult the nameCache to decide whether a mangled name is available or not.
  //
  // For example:
  //
  // file1:
  //   obj.foo -> A
  //   obj.bar -> B
  //
  // file2:
  //   obj.bar -> B (Correctly chosen from nameCache.)
  //   obj.baz -> A (Oops, foo and baz are different properties on the same
  //                 object, but now they both have the same mangled name,
  //                 which could result in very unpredictable behavior).
  //
  // To trick Terser into doing what we need here, we first create a giant bundle
  // of all our code in a single file, tell Terser to minify that, and then throw
  // it away. This seeds the name cache in a way that guarantees every property
  // gets a unique mangled name.
  const nameCache = {
    props: {
      // Note all properties in the terser name cache are prefixed with '$'
      // (presumably to avoid collisions with built-ins).
      props: Object.entries(crossPackagePropertyMangles).reduce(
        (obj, [name, val]) => ({
          ...obj,
          ['$' + name]: val,
        }),
        {}
      ),
    },
  };
  const nameCacheSeederInfile = 'name-cache-seeder-virtual-input.js';
  const nameCacheSeederOutfile = 'name-cache-seeder-throwaway-output.js';
  const nameCacheSeederContents = [
    // Import every entry point so that we see all property accesses.
    ...entryPoints.map((name) => `import './development/${name}.js';`),
    // Synthesize a property access for all cross-package mangled property names
    // so that even if we don't access a property in this package, we will still
    // reserve other properties from re-using that name.
    ...Object.keys(crossPackagePropertyMangles).map(
      (name) => `console.log(window.${name});`
    ),
  ].join('\n');

  const terserOptions = generateTerserOptions(nameCache);

  return [
    {
      input: nameCacheSeederInfile,
      output: {
        file: nameCacheSeederOutfile,
        format: 'esm',
      },
      external,
      // Since our virtual name cache seeder module doesn't export anything,
      // almost everything gets tree shaken out, and terser wouldn't see any
      // properties.
      treeshake: false,
      plugins: [
        virtual({
          [nameCacheSeederInfile]: nameCacheSeederContents,
        }),
        terser(terserOptions),
        skipBundleOutput,
      ],
    },
    {
      input: entryPoints.map((name) => `development/${name}.js`),
      output: {
        dir: './',
        format: 'esm',
        // Preserve existing module structure (e.g. preserve the "directives/"
        // directory).
        preserveModules: true,
        sourcemap: !CHECKSIZE,
      },
      external,
      plugins: [
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
          'const ENABLE_EXTRA_SECURITY_HOOKS = true':
            'const ENABLE_EXTRA_SECURITY_HOOKS = false',
        }),
        // This plugin automatically composes the existing TypeScript -> raw JS
        // sourcemap with the raw JS -> minified JS one that we're generating here.
        sourcemaps(),
        terser(terserOptions),
        summary(),
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
              // Copy platform support tests.
              copy({
                targets: [
                  {
                    src: `src/test/platform-support/*_test.html`,
                    dest: [
                      'development/test/platform-support',
                      'test/platform-support',
                    ],
                  },
                ],
              }),
            ]),
      ],
    },
    ...bundled.map(({file, output, name}) =>
      litMonoBundleConfig({
        file,
        output,
        name,
        terserOptions: terserOptions,
      })
    ),
  ];
}

export const litMonoBundleConfig = ({
  file,
  output,
  name,
  terserOptions = generateTerserOptions(),
  // eslint-disable-next-line no-undef
} = options) => ({
  input: `development/${file}.js`,
  output: {
    file: `${output || file}.js`,
    format: 'umd',
    name,
    sourcemap: !CHECKSIZE,
  },
  plugins: [
    nodeResolve(),
    replace({
      'const DEV_MODE = true': 'const DEV_MODE = false',
      'const ENABLE_EXTRA_SECURITY_HOOKS = true':
        'const ENABLE_EXTRA_SECURITY_HOOKS = false',
    }),
    // This plugin automatically composes the existing TypeScript -> raw JS
    // sourcemap with the raw JS -> minified JS one that we're generating here.
    sourcemaps(),
    terser(terserOptions),
    summary(),
  ],
});
