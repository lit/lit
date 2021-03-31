/**
 * @license
 * Copyright 2018 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import summary from 'rollup-plugin-summary';
import {terser} from 'rollup-plugin-terser';
import copy from 'rollup-plugin-copy';
import nodeResolve from '@rollup/plugin-node-resolve';
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

// Private properties which should never be mangled. They need to be long/obtuse
// to avoid collisions since they are used to brand values in positions that
// accept any value. We don't use a Symbol for these to support mixing and
// matching values from different versions.
const reservedProperties = ['_$litType$', '_$litDirective$', '_$litPart$'];

// Private properties which should be stable between versions but are used on
// unambiguous objects and thus are safe to mangle. These include properties on
// objects accessed between packages or objects used as values which may be
// accessed between different versions of a given package.
//
// By convention, stable properties should be prefixed with `_$` in the code so
// they are easily identifiable as properties requiring version stability and
// thus special attention.
//
// Mangled names are uppercase letters, in case we ever might want to use
// lowercase letters for short, public APIs. Keep this list in order by mangled
// name to avoid accidental re-assignments. When adding a name, add to the end
// and choose the next letter.
//
// ONCE A MANGLED NAME HAS BEEN ASSIGNED TO A PROPERTY, IT MUST NEVER BE USED
// FOR A DIFFERENT PROPERTY IN SUBSEQUENT STABLE VERSIONS.
const stableProperties = {
  // lit-html: ChildPart (used by polyfill-support)
  _$startNode: 'A',
  _$endNode: 'B',
  _$getTemplate: 'C',
  // lit-html: TemplateInstance (used by polyfill-support)
  _$template: 'D',
  // reactive-element: ReactiveElement (used by polyfill-support)
  _$didUpdate: 'E',
  // lit-element: LitElement (used by hydrate-support)
  _$renderImpl: 'F',
  // hydrate-support: LitElement (added by hydrate-support)
  _$needsHydration: 'G',
  // lit-html: Part (used by hydrate, polyfill-support)
  _$committedValue: 'H',
  // lit-html: Part (used by hydrate, directive-helpers, polyfill-support, ssr-support)
  _$setValue: 'I',
  // polyfill-support: LitElement (added by polyfill-support)
  _$handlesPrepareStyles: 'J',
  // lit-element: ReactiveElement (used by ssr-support)
  _$attributeToProperty: 'K',
  // lit-element: ReactiveElement (used by ssr-support)
  _$changedProperties: 'L',
  // lit-html: ChildPart, AttributePart, TemplateInstance, Directive (accessed by
  // async-directive)
  _$parent: 'M',
  _$disconnetableChildren: 'N',
  // async-directive: AsyncDirective
  _$setDirectiveConnected: 'O',
  // lit-html: ChildPart (added by async-directive)
  _$setChildPartConnected: 'P',
  // lit-html: ChildPart (added by async-directive)
  _$reparentDisconnectables: 'Q',
  // lit-html: ChildPart (used by directive-helpers)
  _$clear: 'R',
  // lit-html: Directive (used by private-ssr-support)
  _$resolve: 'S',
};

const alpha = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const validMangledNames = [...alpha, ...alpha.map((c) => `A${c}`)];

// Validate stableProperties list, just to be safe; catches dupes and
// out-of-order mangled names
let mangledNameCount = 0;
const reservedPropertySet = new Set();

for (const [prop, mangle] of Object.entries(stableProperties)) {
  if (!prop.startsWith('_$')) {
    throw new Error(
      `stableProperties should start with prefix '_$' ` +
        `(property '${prop}' violates the convention)`
    );
  }
  if (mangle !== validMangledNames[mangledNameCount++]) {
    throw new Error(
      `Add new stableProperties to the end of the list using ` +
        `the next available letter (mangled name '${mangle}' for property ` +
        `${prop} was unexpected)`
    );
  }
}

/**
 * Prefixes all class properties with the given prefix character. This is to
 * effectively namespace private properties on subclassable objects to avoid
 * accidental collisions when users (or our own packages) subclass them. We
 * choose a different prefix character per compilation unit (package), which
 * guarantees that automatically chosen mangled names don't collide between our
 * own packages.
 *
 * Note that Terser has no understanding of classes; class properties getting
 * prefix treatment are identified via convention, where class properties are
 * authored with double `__` whereas normal object properties that can be
 * mangled un-prefixed use single `_`.
 *
 * Prefix characters chosen in the "Other Letter (Lo)" unicode category
 * (https://codepoints.net/search?gc=Lo) are valid in JS identifiers, should be
 * sufficiently collision-proof to hand-authored code, and are unlikely to be
 * chosen (at least default) by minifiers.
 */
const addedClassPrefix = new WeakSet();
const prefixClassProperties = (context, nameCache, prefix) => {
  // Only prefix class properties once per options context, as a perf optimization
  if (nameCache && !addedClassPrefix.has(context)) {
    const {
      props: {props},
    } = nameCache;
    for (const p in props) {
      // Note all properties in the terser name cache are prefixed with '$'
      // (presumably to avoid collisions with built-ins). Checking for the
      // prefix is just to ensure we don't double-prefix properties if
      // `prefixClassProperties` is called twice on the same `nameCache`.
      if (p.startsWith('$__') && !props[p].startsWith(prefix)) {
        props[p] = prefix + props[p];
      }
    }
    addedClassPrefix.add(context);
  }
  return nameCache;
};

const generateTerserOptions = (nameCache = null, classPropertyPrefix = '') => ({
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
  // This is implemented as a getter, so that we apply the class property prefix
  // after the `nameCacheSeeder` build runs
  get nameCache() {
    return prefixClassProperties(this, nameCache, classPropertyPrefix);
  },
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
  classPropertyPrefix,
  // eslint-disable-next-line no-undef
} = options) {
  // The Terser shared name cache allows us to mangle the names of properties
  // consistently across modules, so that e.g. directive-helpers.js can safely
  // access internal details of lit-html.js.
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
      props: Object.entries(stableProperties).reduce(
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
    ...Object.keys(stableProperties).map(
      (name) => `console.log(window.${name});`
    ),
  ].join('\n');
  const nameCacheSeederTerserOptions = generateTerserOptions(nameCache);

  const terserOptions = generateTerserOptions(nameCache, classPropertyPrefix);

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
        terser(nameCacheSeederTerserOptions),
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
          'const ENABLE_SHADYDOM_NOPATCH = true':
            'const ENABLE_SHADYDOM_NOPATCH = false',
        }),
        // This plugin automatically composes the existing TypeScript -> raw JS
        // sourcemap with the raw JS -> minified JS one that we're generating here.
        sourcemaps(),
        terser(terserOptions),
        summary(),
        ...(CHECKSIZE
          ? [skipBundleOutput]
          : [
              // Copy polyfill support tests.
              copy({
                targets: [
                  {
                    src: `src/test/*_test.html`,
                    dest: ['development/test/', 'test/'],
                  },
                  {
                    // TODO: use flatten: false when this is fixed
                    // https://github.com/vladshcherbin/rollup-plugin-copy/issues/37
                    src: `src/test/polyfill-support/*_test.html`,
                    dest: [
                      'development/test/polyfill-support',
                      'test/polyfill-support',
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
        terserOptions,
      })
    ),
  ];
}

const litMonoBundleConfig = ({
  file,
  output,
  name,
  terserOptions,
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
      'const ENABLE_SHADYDOM_NOPATCH = true':
        'const ENABLE_SHADYDOM_NOPATCH = false',
      // For downleveled ES5 build of polyfill-support
      'var ENABLE_SHADYDOM_NOPATCH = true':
        'var ENABLE_SHADYDOM_NOPATCH = false',
    }),
    // This plugin automatically composes the existing TypeScript -> raw JS
    // sourcemap with the raw JS -> minified JS one that we're generating here.
    sourcemaps(),
    terser(terserOptions),
    summary(),
  ],
});
