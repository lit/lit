/**
 * @license
 * Copyright 2018 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {summary} from 'rollup-plugin-summary';
import {terser} from 'rollup-plugin-terser';
import copy from 'rollup-plugin-copy';
import nodeResolve from '@rollup/plugin-node-resolve';
import sourcemaps from 'rollup-plugin-sourcemaps';
import replace from '@rollup/plugin-replace';
import virtual from '@rollup/plugin-virtual';
import inject from '@rollup/plugin-inject';

// Greek prefixes used with minified class and stable properties on objects to
// avoid collisions with user code and/or subclasses between packages. They are
// defined here rather than via an argument to litProdConfig() so we can
// validate the list used by each package is unique (since copy/pasting the
// individual package-based configs is common and error-prone)
const STABLE_PROPERTY_PREFIX = '_$A';
const PACKAGE_CLASS_PREFIXES = {
  lit: '_$B',
  'lit-html': '_$C',
  'lit-element': '_$D',
  '@lit/reactive-element': '_$E',
  '@lit-labs/motion': '_$F',
  '@lit-labs/react': '_$G',
  '@lit-labs/scoped-registry-mixin': '_$H',
  '@lit-labs/ssr-client': '_$I',
  '@lit-labs/task': '_$J',
  '@lit-labs/router': '_$K',
  '@lit-labs/observers': '_$L',
  '@lit-labs/context': '_$M',
  '@lit-labs/vue-utils': '_$N',
  '@lit-labs/preact-signals': '_$O',
  '@lit/task': '_$P',
  '@lit/context': '_$Q',
  '@lit/react': '_$R',
};

// Validate prefix uniqueness
const classPrefixes = Object.values(PACKAGE_CLASS_PREFIXES);
const uniqueClassPrefixes = new Set(classPrefixes);
if (classPrefixes.length !== uniqueClassPrefixes.size) {
  throw new Error('PACKAGE_CLASS_PREFIXES list must be unique.');
}
if (uniqueClassPrefixes.has(STABLE_PROPERTY_PREFIX)) {
  throw new Error(
    'STABLE_PROPERTY_PREFIX was duplicated in PACKAGE_CLASS_PREFIXES.'
  );
}

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
// Note for compatibility with other build tools, these properties are manually
// quoted in the source.
const reservedProperties = [
  '_$litType$',
  '_$litDirective$',
  '_$litPart$',
  '_$litElement$',
  '_$litStatic$',
  '_$cssResult$',
  '_$litProps$',
];

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
  // lit-element: LitElement (used by experimental--support)
  _$renderImpl: 'F',
  // experimental-hydrate-support: LitElement (added by experimental-hydrate-support)
  _$needsHydration: 'G',
  // lit-html: Part (used by experimental-hydrate, polyfill-support)
  _$committedValue: 'H',
  // lit-html: Part (used by experimental-hydrate, directive-helpers, polyfill-support, ssr-support)
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
  _$disconnectableChildren: 'N',
  // async-directive: AsyncDirective
  _$notifyDirectiveConnectionChanged: 'O',
  // lit-html: ChildPart (added by async-directive)
  _$notifyConnectionChanged: 'P',
  // lit-html: ChildPart (added by async-directive)
  _$reparentDisconnectables: 'Q',
  // lit-html: ChildPart (used by directive-helpers)
  _$clear: 'R',
  // lit-html: Directive (used by private-ssr-support)
  _$resolve: 'S',
  // lit-html: Directive (used by lit-html)
  _$initialize: 'T',
  // lit-html: Disconnectable interface (used by lit-html and AsyncDirective)
  _$isConnected: 'U',
  // lit-html: TemplateInstance (used by private-ssr-support)
  _$parts: 'V',
};

const alpha = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const validMangledNames = [...alpha, ...alpha.map((c) => `A${c}`)];

// Validate stableProperties list, just to be safe; catches dupes and
// out-of-order mangled names
let mangledNameCount = 0;

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
const prefixProperties = (
  context,
  nameCache,
  classPropertyPrefix,
  testPropertyPrefix
) => {
  // Only prefix class properties once per options context, as a perf optimization
  if (nameCache && !addedClassPrefix.has(context)) {
    const {
      props: {props},
    } = nameCache;
    classPropertyPrefix = testPropertyPrefix + classPropertyPrefix;
    for (const p in props) {
      // Note all properties in the terser name cache are prefixed with '$'
      // (presumably to avoid collisions with built-ins). Checking for the
      // prefix is just to ensure we don't double-prefix properties if
      // `prefixClassProperties` is called twice on the same `nameCache`.
      if (p.startsWith('$__') && !props[p].startsWith(classPropertyPrefix)) {
        props[p] = classPropertyPrefix + props[p];
      } else if (testPropertyPrefix && !(p.slice(1) in stableProperties)) {
        // Only change the names of non-stable properties when testing
        props[p] = testPropertyPrefix + props[p];
      }
    }
    addedClassPrefix.add(context);
  }
  return nameCache;
};

const generateTerserOptions = (
  nameCache = null,
  classPropertyPrefix = '',
  testPropertyPrefix = ''
) => ({
  warnings: true,
  ecma: 2021,
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
    return prefixProperties(
      this,
      nameCache,
      classPropertyPrefix,
      testPropertyPrefix
    );
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

/**
 * Inject an import for the SSR DOM Shim into the Node build of
 * `@lit-labs/reactive-element`, and modify the `extends` clause of
 * `ReactiveElement` to use that `HTMLElement` shim, unless a global version has
 * already been defined.
 *
 * ```js
 * import {HTMLElement, customElements} from '@lit-labs/ssr-dom-shim';
 *
 * // ...
 *
 * export class ReactiveElement extends (globalThis.HTMLElement ?? HTMLElement) {
 *   // ...
 * }
 * ```
 */
const injectNodeDomShimIntoReactiveElement = [
  inject({
    HTMLElement: ['@lit-labs/ssr-dom-shim', 'HTMLElement'],
    customElements: ['@lit-labs/ssr-dom-shim', 'customElements'],
    include: ['**/packages/reactive-element/development/reactive-element.js'],
  }),
  inject({
    Buffer: ['buffer', 'Buffer'],
    include: [
      '**/packages/lit-html/development/experimental-hydrate.js',
      '**/packages/labs/ssr-client/development/lib/hydrate-lit-html.js',
    ],
  }),
  replace({
    preventAssignment: true,
    values: {
      'extends HTMLElement': 'extends (globalThis.HTMLElement ?? HTMLElement)',
    },
    include: ['**/packages/reactive-element/development/reactive-element.js'],
  }),
];

export function litProdConfig({
  entryPoints,
  external = [],
  bundled = [],
  testPropertyPrefix,
  packageName,
  outputDir = './',
  copyHtmlTests = true,
  includeNodeBuild = false,
  // eslint-disable-next-line no-undef
} = options) {
  const classPropertyPrefix = PACKAGE_CLASS_PREFIXES[packageName];
  if (classPropertyPrefix === undefined) {
    throw new Error(
      `Package ${packageName} was being built using 'litProdConfig' ` +
        `but does not have a PACKAGE_CLASS_PREFIXES mapping in rollup-common.js.`
    );
  }

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
          ['$' + name]: STABLE_PROPERTY_PREFIX + val,
        }),
        {}
      ),
    },
  };

  const nameCacheSeederInfile = 'name-cache-seeder-virtual-input.js';
  const nameCacheSeederOutfile = 'name-cache-seeder-throwaway-output.js';
  const nameCacheSeederContents = [
    // Import every entry point so that we see all property accesses.
    // Give a unique named import to prevent duplicate identifier errors.
    ...entryPoints.map(
      (name, idx) => `import * as import${idx} from './development/${name}.js';`
    ),
    // Prevent tree shaking that occurs during mangling.
    ...entryPoints.map((_name, idx) => `console.log(import${idx});`),
    // Synthesize a property access for all cross-package mangled property names
    // so that even if we don't access a property in this package, we will still
    // reserve other properties from re-using that name.
    ...Object.keys(stableProperties).map(
      (name) => `console.log(window.${name});`
    ),
  ].join('\n');
  const nameCacheSeederTerserOptions = generateTerserOptions(nameCache);

  const terserOptions = generateTerserOptions(
    nameCache,
    classPropertyPrefix,
    testPropertyPrefix
  );

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
    // Production build
    {
      input: entryPoints.map((name) => `development/${name}.js`),
      output: {
        dir: outputDir,
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
          preventAssignment: true,
          values: {
            'const DEV_MODE = true': 'const DEV_MODE = false',
            'const ENABLE_EXTRA_SECURITY_HOOKS = true':
              'const ENABLE_EXTRA_SECURITY_HOOKS = false',
            'const ENABLE_SHADYDOM_NOPATCH = true':
              'const ENABLE_SHADYDOM_NOPATCH = false',
          },
        }),
        // This plugin automatically composes the existing TypeScript -> raw JS
        // sourcemap with the raw JS -> minified JS one that we're generating here.
        sourcemaps(),
        terser(terserOptions),
        summary({
          showBrotliSize: true,
          showGzippedSize: true,
        }),
        ...(CHECKSIZE ? [skipBundleOutput] : []),
        ...(copyHtmlTests && !CHECKSIZE
          ? [
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
            ]
          : []),
      ],
    },
    // Node build
    ...(includeNodeBuild
      ? [
          {
            input: entryPoints.map((name) => `development/${name}.js`),
            output: {
              dir: `${outputDir}/node`,
              format: 'esm',
              preserveModules: true,
              sourcemap: !CHECKSIZE,
            },
            external,
            plugins: [
              replace({
                preventAssignment: true,
                values: {
                  // Setting NODE_MODE to true enables node-specific behaviors,
                  // i.e. using globalThis instead of window, and shimming APIs
                  // needed for Lit bootup.
                  'const NODE_MODE = false': 'const NODE_MODE = true',
                  // Other variables should behave like prod mode.
                  'const DEV_MODE = true': 'const DEV_MODE = false',
                  'const ENABLE_EXTRA_SECURITY_HOOKS = true':
                    'const ENABLE_EXTRA_SECURITY_HOOKS = false',
                  'const ENABLE_SHADYDOM_NOPATCH = true':
                    'const ENABLE_SHADYDOM_NOPATCH = false',
                },
              }),
              ...injectNodeDomShimIntoReactiveElement,
              sourcemaps(),
              // We want the production Node build to be minified because:
              //
              // 1. It should be very slightly faster, even in Node where bytes
              //    are not as important as in the browser.
              //
              // 2. It means we don't need a Node build for lit-element. There
              //    is no Node-specific logic needed in lit-element. However,
              //    lit-element and reactive-element must be consistently
              //    minified or unminified together, because lit-element
              //    references properties from reactive-element which will
              //    otherwise have different names. The default export that
              //    lit-element will use is minified.
              terser(terserOptions),
              summary({
                showBrotliSize: true,
                showGzippedSize: true,
              }),
              ...(CHECKSIZE ? [skipBundleOutput] : []),
            ],
          },
          {
            // Also create a development Node build that does not minify to be
            // used during development so it can work along side the unminified
            // dev build of lit-element
            input: entryPoints.map((name) => `development/${name}.js`),
            output: {
              dir: `${outputDir}/node/development`,
              format: 'esm',
              preserveModules: true,
              sourcemap: !CHECKSIZE,
            },
            external,
            plugins: [
              replace({
                preventAssignment: true,
                values: {
                  // Setting NODE_MODE to true enables node-specific behaviors,
                  // i.e. using globalThis instead of window, and shimming APIs
                  // needed for Lit bootup.
                  'const NODE_MODE = false': 'const NODE_MODE = true',
                  'const ENABLE_SHADYDOM_NOPATCH = true':
                    'const ENABLE_SHADYDOM_NOPATCH = false',
                },
              }),
              ...injectNodeDomShimIntoReactiveElement,
              sourcemaps(),
              summary({
                showBrotliSize: true,
                showGzippedSize: true,
              }),
              ...(CHECKSIZE ? [skipBundleOutput] : []),
            ],
          },
        ]
      : []),
    // CDN bundles
    ...bundled.map(({file, output, name, format, sourcemapPathTransform}) =>
      litMonoBundleConfig({
        file,
        output,
        name,
        terserOptions,
        format,
        sourcemapPathTransform,
      })
    ),
  ];
}

const litMonoBundleConfig = ({
  file,
  output,
  name,
  terserOptions,
  format = 'umd',
  sourcemapPathTransform,
  // eslint-disable-next-line no-undef
} = options) => ({
  input: `development/${file}.js`,
  output: {
    file: `${output || file}.js`,
    format,
    name,
    sourcemap: !CHECKSIZE,
    sourcemapPathTransform,
  },
  plugins: [
    nodeResolve({
      // We want to resolve to development, because the default is production,
      // which is already rolled-up sources. That creates an unnecessary
      // dependency between rollup build steps, and causes double-minification.
      exportConditions: ['development'],
    }),
    replace({
      preventAssignment: true,
      values: {
        'const DEV_MODE = true': 'const DEV_MODE = false',
        'const ENABLE_EXTRA_SECURITY_HOOKS = true':
          'const ENABLE_EXTRA_SECURITY_HOOKS = false',
        'const ENABLE_SHADYDOM_NOPATCH = true':
          'const ENABLE_SHADYDOM_NOPATCH = false',
        // For downleveled ES5 build of polyfill-support
        'var DEV_MODE = true': 'var DEV_MODE = false',
        'var ENABLE_EXTRA_SECURITY_HOOKS = true':
          'var ENABLE_EXTRA_SECURITY_HOOKS = false',
        'var ENABLE_SHADYDOM_NOPATCH = true':
          'var ENABLE_SHADYDOM_NOPATCH = false',
      },
    }),
    // This plugin automatically composes the existing TypeScript -> raw JS
    // sourcemap with the raw JS -> minified JS one that we're generating here.
    sourcemaps(),
    terser(terserOptions),
    summary({
      showBrotliSize: true,
      showGzippedSize: true,
    }),
  ],
});
