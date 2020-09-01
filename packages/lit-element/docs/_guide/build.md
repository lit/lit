---
layout: guide
title: Build for production
slug: build
---

{::options toc_levels="1..3" /}
* ToC
{:toc}

When building an app that includes LitElement components, you can use common JavaScript build tools like [Rollup](https://rollupjs.org/) or [webpack](https://webpack.js.org/). 

We recommend Rollup because it's designed to work with the standard ES module format.

For a set of sample build configurations using Rollup, see [Building with Rollup](#building-with-rollup).

If you're interested in building with a different tool, or integrating LitElement into an existing build system, see [Build requirements](#build-requirements).

## Building with Rollup {#building-with-rollup}

There are many ways to set up Rollup to bundle your project. This section describes a two basic builds: 

*   A modern build that runs on evergreen browsers.
*   A universal build that runs on browsers back to Internet Explorer 11.

If you only need to support evergreen browsers, you can use the modern build by itself. If you want to support the widest range of browsers with a single build, you can use the backwards-compatible build.

The last part of this section discusses ways to use the two builds together to provide the faster, smaller modern build to browsers that support it while also supporting older browsers.

The example configurations here use the Shop demo app as an example. You can find all of the configurations described here in a branch of the Shop repo:

*  [https://github.com/Polymer/shop/tree/rollup-examples-v2](https://github.com/Polymer/shop/tree/rollup-examples-v2)

### Modern browser build {#modern-browser-build}

The modern browser build uses the following npm packages:

*   [`rollup`](https://www.npmjs.com/package/rollup). The Rollup bundler.
*   [`@rollup/plugin-node-resolve`](https://www.npmjs.com/package/@rollup/plugin-node-resolve). For resolving bare module specifiers. (See [Bare module specifiers](#bare-module-specifiers) for more information.)
*   [`rollup-plugin-terser`](https://www.npmjs.com/package/rollup-plugin-terser). To minify JavaScript. This isn't strictly required, but if you're bundling for production, you probably want to minify JavaScript.
*   [`rollup-plugin-copy`](https://www.npmjs.com/package/rollup-plugin-copy). For copying static assets to the build folder.
*   [`rollup-plugin-minify-html-literals`](https://www.npmjs.com/package/rollup-plugin-minify-html-literals). An optional optimization.

The Rollup configuration file for this build looks like this: \

```js
import resolve from '@rollup/plugin-node-resolve';
import { terser } from 'rollup-plugin-terser';
import minifyHTML from 'rollup-plugin-minify-html-literals';
import copy from 'rollup-plugin-copy';

// Static assets will vary depending on the application
const copyConfig = {
  targets: [
    { src: 'node_modules/@webcomponents', dest: 'build-modern/node_modules' },
    { src: 'images', dest: 'build-modern' },
    { src: 'data', dest: 'build-modern' },
    { src: 'index.html', dest: 'build-modern' },
  ],
};

// The main JavaScript bundle for modern browsers that support
// JavaScript modules and other ES2015+ features.
const config = {
  input: 'src/components/shop-app.js',
  output: {
    dir: 'build-modern/src/components',
    format: 'es',
  },
  plugins: [
    minifyHTML(),
    copy(copyConfig),
    resolve(),
  ],
  preserveEntrySignatures: false,
};

if (process.env.NODE_ENV !== 'development') {
  config.plugins.push(terser());
}

export default config;
```

#### Even simpler starter {#even-simpler-starter}

The [rollup-starter-app](https://github.com/rollup/rollup-starter-app) repo is a bare-bones starter project for building an app with Rollup. Although the repo doesn't include LitElement, it includes everything you need to bundle a LitElement app. If you want to use this project as a model for your own project, the most important files to look at are [`package.json`](https://github.com/rollup/rollup-starter-app/blob/master/package.json) and [`rollup.config.js`](https://github.com/rollup/rollup-starter-app/blob/master/rollup.config.js).

Note that in addition to the required plugins, [rollup-starter-app](https://github.com/rollup/rollup-starter-app) includes the CommonJS plugin, [@rollup/plugin-commonjs](https://www.npmjs.com/package/@rollup/plugin-commonjs). This plugin **isn't** required for LitElement, but can be useful if you want to import packages that are only distributed as CommonJS modules.

### Universal build {#universal-build}

The universal build is compiled to ES5 for older browsers (primarily IE11), and uses System.js as a module system (because older browsers don't support native JavaScript modules).

The universal build requires all of the packages used by the modern build, plus the following:

Babel:

*   [`@babel/core`](https://www.npmjs.com/package/@babel/core) 
*   [`@babel/cli`](https://babeljs.io/docs/en/babel-cli) 
*   [`@babel/preset-env`](https://babeljs.io/docs/en/babel-preset-env)

Polyfills used by Babel:

*   [`corejs`](https://www.npmjs.com/package/core-js)
*   [`regenerator-runtime`](https://www.npmjs.com/package/core-js)

Rollup plugins:

*   [`rollup-plugin-babel`](https://www.npmjs.com/package/@rollup/plugin-babel)
*   [`rollup-plugin-commonjs`](https://www.npmjs.com/package/@rollup/plugin-babel)

SystemJS module loader:

*   [`systemjs`](https://www.npmjs.com/package/systemjs)

If you just want to look at the code, here are the most important parts of the universal build:

*   Rollup configuration: [https://github.com/Polymer/shop/blob/rollup-examples-v2/rollup-universal.js](https://github.com/Polymer/shop/blob/rollup-examples-v2/rollup-universal.js)
*   `index.html`: [https://github.com/Polymer/shop/blob/rollup-examples-v2/index-universal.html](https://github.com/Polymer/shop/blob/rollup-examples-v2/rollup-universal.js)

The following sections describe aspects of the build. 

#### Babel build and polyfill bundle {#babel-build-and-polyfill-bundle}

Unlike the modern build, this build produces two separate bundles: one for the application code, and one for the polyfills required by Babel. Many Babel configurations produce a single bundle, which includes the polyfills as well as the application code. However, this can cause problems with other polyfills, including the Web Components polyfills. Loading the Babel polyfills separately, prior to loading the Web Components polyfills, allows both sets of polyfills to work correctly. The Babel polyfills are supplied as separate Common JS modules. 

#### Babel configuration {#babel-configuration}

The Babel configuration for this build is fairly small. It tells Babel to use the `@babel/preset-env` plugin to compile to code compatible with Internet Explorer 11.

```js
import babel from 'rollup-plugin-babel';
...

const babelConfig = {
  babelrc: false,
  ...{
    presets: [
      [
        '@babel/preset-env',
        {
          targets: {
            ie: '11',
          },
        },
      ],
    ],
  },
};
```

#### Application bundle {#application-bundle}

The Rollup configuration for the application bundle looks similar to the configuration for the model build:

```js
const configs = [
  // The main JavaScript bundle for older browsers that don't support
  // JavaScript modules or ES2015+.
  {
    input: ['src/components/shop-app.js'],
    output: {
      dir: 'build-universal/nomodule/src/components',
      format: 'systemjs',
    },
    plugins: [
      minifyHTML(),
      babel(babelConfig),
      resolve(),
      copy(copyConfig),
    ],
    preserveEntrySignatures: false,
  },
```

There are three main differences from the modern configuration:

*   It defines a `configs` array, instead of a single configuration object.
*   The main app bundle uses a different format (SystemJS instead of ES modules).
*   The main app bundle is compiled using the Babel plugin.

#### Polyfill bundle {#polyfill-bundle}

The entrypoint for the Babel polyfills bundle is a JavaScript file that imports two Common JS modules, which in turn import a number of smaller modules:

```js
import 'core-js/stable';
import 'regenerator-runtime/runtime';
```

The Rollup config bundles all of these modules into a single file:

```js
const configs = [

   ... 

  // Babel polyfills for older browsers that don't support ES2015+.
  {
    input: 'src/babel-polyfills-nomodule.js',
    output: {
      file: 'build-universal/nomodule/src/babel-polyfills-nomodule.js',
      format: 'iife',
    },
    plugins: [commonjs({ include: ['node_modules/**'] }), resolve()],
  },
];
```

#### Loading it all {#loading-it-all}

The `index.html` file loads all of the bundles in the correct order:

*   The Babel polyfills bundle.
*   The Web Components polyfill loader, which performs feature detection and loads any required Web Components polyfills.
*   The SystemJS loader.
*   The application bundle.

(The example `index.html` also includes a small application-specific polyfill for the `fetch` API.)

With extra material removed, the portion of `index.html` that loads script looks like this:

```html
<!-- Babel polyfills--need to be loaded _before_ Web 
     Components polyfills -->
<script src="nomodule/src/babel-polyfills-nomodule.js"></script>

<!-- Load Web Components polyfills, if needed. -->
<script src="node_modules/@webcomponents/webcomponentsjs/webcomponents-loader.js"></script>

<!-- SystemJS loader -->
<script src="node_modules/systemjs/dist/s.min.js"></script>

<!-- Use SystemJS to load the application bundle -->
<script>
  System.import('./nomodule/src/components/shop-app.js');
</script>
```

### Using multiple builds {#using-multiple-builds}

In theory, it's ideal to deliver a modern ES6 bundle to modern browsers and the larger ES5 bundle to older browsers. In practice, this can be challenging. Here are three possible techniques for delivering different builds to different browsers:

*   `module` and `nomodule` script tags. 

*   Client-side feature detection. 

*   Differential serving. 

These approaches are discussed in the following sections.

#### Module/nomodule gambit

Since browsers that don't support modules won't execute module scripts (`<script type="module">`), and browsers that support modules won't load `nomodule` scripts (`<script nomodule>`), you can include the legacy bundles using `nomodule`.  In practice, the browsers that support modules also support the other ES6 language features used by LitElement, and don't require transpilation.

You can see this in practice in the Shop example app. See the [`index-modnomod.html`](https://github.com/Polymer/shop/blob/rollup-examples-v2/index-modnomod.html) file.
The advantage of this technique is that it doesn't require any logic on the server side.

The main drawback to this technique is that Edge versions 16–18 support JavaScript modules, but _don't_ support dynamic imports. That's not an issue if your application can be packaged in a single bundle, but if you have a larger application that uses dynamic imports and you need to support older versions of Edge, this technique won't work for you. 

Another drawback is that IE 11 (and possibly some other older browsers) may download (but not execute) `<script type="module">` bundles, and Edge 16-18 may download (but not execute) `<script nomodule>` bundles. This represents a performance penalty on these older browsers.

#### Client-side feature detection

In this technique, the initial page load includes a small script that runs feature detection code and then imperatively loads one of the bundles. 

This is another technique that doesn't require any server logic. However, it can introduce delays, since the browser won't start downloading the application bundle until after the initial JavaScript payload has downloaded and executed. 

#### Differential serving

In this technique, the server uses the User-Agent request header to determine which bundle to serve to the browser. This technique (also called "browser sniffing") has drawbacks. It's less correct than client-side feature detection, in that it relies on a static list of features supported by each browser. Also, some browsers may send an incorrect User-Agent header. However, it tends to have a performance advantage over the other approaches, since the browser only receives the bundles it needs.

The [prpl-server](https://github.com/Polymer/prpl-server) project is a Node.js web server that supports differential serving. 

## Build requirements {#build-requirements}

This section describes the requirements for building applications using LitElement. Use this section if you're creating your own build setup.

LitElement is packaged as a set of ES modules, written in modern JavaScript (ES 2017). These are supported natively in modern browsers (Chrome, Safari, Firefox, and Edge, for example). LitElement also uses bare module specifiers, which are not supported by any browsers yet.

When building an app using LitElement, your build system will need to handle the following:

*   Resolving bare (or Node-style) module identifiers. LitElement uses bare module specifiers.
*   Transforming ES modules to another module system, if required, to support older browsers.
*   Transpiling modern JavaScript syntax to ES 5, if required, to support older browsers.

For older browsers, you'll also need to load certain polyfills:

*   Web Components polyfills
*   Dynamic imports polyfill. Required by browsers (in particular, Edge 16 through 18) that support static imports for ES modules, but not dynamic imports. 

### Bare module specifiers {#bare-module-specifiers}

LitElement uses bare module specifiers to import modules from the lit-html library, like this:

```js
import {html} from 'lit-html';
```

Browsers currently only support loading modules from URLs or relative paths, not bare names referring to e.g. an npm package, so the build system needs to handle them: either by transforming the specifier to one that works for ES modules in the browser, or by producing a different type of module as output.

Webpack automatically handles bare module specifiers; for Rollup, you'll need a plugin ([@rollup/plugin-node-resolve](https://github.com/rollup/plugins/tree/master/packages/node-resolve)).

**Why bare module specifiers?** Bare module specifiers let you import modules without knowing exactly where the package manager has installed them. A standards proposal called [Import maps](https://github.com/WICG/import-maps) would let browsers support bare module specifiers. In the meantime, bare import specifiers can easily be transformed as a build step. There are also some polyfills and module loaders that support import maps. 

### Supporting older browsers {#supporting-older-browsers}

Supporting older browsers (specifically Internet Explorer 11), requires a number of extra steps:

*   Transpiling modern JavaScript syntax to ES 5.
*   Transforming ES modules to another module system.
*   Loading polyfills.
    *   Babel polyfills.
    *   Web Components polyfills.

You may need other polyfills depending on your application. 

#### Transpiling to ES5 {#transpiling-to-es5}

Rollup, webpack and other build tools have plugins to support transpiling modern JavaScript for older browsers. [Babel](https://babeljs.io/) is the most commonly used transpiler. 

Unlike some libraries, LitElement is delivered as a set of ES modules using modern JavaScript. When you build your app, you need to compile LitElement as well as your own code. 

If you have a build already set up, it may be configured to ignore the `node_modules` folder when transpiling. If this is the case, we recommend updating this to transpile LitElement and lit-html. For example, if you're using the [Rollup Babel plugin](https://github.com/rollup/rollup-plugin-babel), you might have a configuration like this to exclude the `node_modules` folder from transpilation:

```js
exclude: [ 'node_modules/**' ]
```

You can replace this with a rule to explicitly include folders to transpile:

```js
include: [ 'src/**', 'node_modules/lit-element/**', 'node_modules/lit-html/**']
```

Babel uses a set of helpers and polyfills for implementing various modern JavaScript features. Babel can package these polyfills in with your application code. However, this causes issues with the Web Components polyfills. To avoid issues, bundle the Babel polyfills separately. See [Polyfill bundle](#polyfill-bundle) for an example of building this bundle with Rollup, and see [Loading it all](#loading-it-all) for an example `index.html` showing the load order. 

**Why no ES5 build?** The LitElement npm package doesn't include an ES5 build because modern JavaScript is smaller and generally faster. When building an application, you can compile modern JavaScript down to create the exact build (or builds) you need based on the browsers you need to support. 

If LitElement included multiple builds, individual elements could end up depending on different builds of LitElement—resulting in multiple versions of the library being shipped down to the browser.


#### Transforming modules {#transforming-modules}

When producing output for IE11, there are three common output formats:

*   No modules (IIFE). Code is bundled as a single file, wrapped in an immediately-invoked function expression (IIFE).
*   AMD modules. Uses the Asynchronous Module Definition format; requires a module loader script, such as [require.js](https://requirejs.org/).
*   SystemJS modules. [SystemJS](https://github.com/systemjs/systemjs) is a module loader that defines its own module format. It also supports AMD, CommonJS, and standard JavaScript modules.

The IIFE format works fine if all of your code can be bundled into a single file. To use code splitting with older browsers like IE11, you'll need to produce output in either the AMD or SystemJS module format.

The universal build in the [Building with Rollup](#building-with-rollup) section uses SystemJS format. You can see an example of loading the main SystemJS module here:

[https://github.com/Polymer/shop/blob/rollup-examples-v2/index-universal.html#L109](https://github.com/Polymer/shop/blob/rollup-examples-v2/index-universal.html#L109)

#### Polyfills {#polyfills}

In addition to any application-specific polyfills, you'll need to load the Babel polyfills and the Web Components polyfills.

Note that the Babel polyfills should be bundled separately from the application bundle, and loaded before the Web Components polyfills. This is discussed in [Babel build and polyfill bundle](#babel-build-and-polyfill-bundle). To see an example of generating the Babel polyfill bundle in Rollup, see [Polyfill bundle](#polyfill-bundle). For an example of loading the bundles, see [Loading it all](#loading-it-all).



## Optimizations {#optimizations}

LitElement projects benefit from the same optimizations as other web projects:

*   Bundling (for example, using Rollup or webpack).
*   Code minification/optimization (Terser works well for LitElement, because it supports modern JavaScript).
*   Compression (such as gzip).

In addition, there are a few smaller optimizations that are more specific to LitElement:

*   Minify template literals. Lit-html templates are defined using template literals, which don't get processed by standard HTML minifiers. Adding a plugin that minifies template literals can result in a modest decrease in code size. (Unless your templates are very large, this is a small optimization).
*   Compile out shady-render. If you're _only_ supporting modern browsers, you can compile out the shady-render module used to support older browsers.

The example builds presented in [Building with Rollup](#building-with-rollup) include most of these optimizations.

### Code minification {#code-minification}

There are many options for code minification. Terser works well with the modern JavaScript used by LitElement. For more information, the [terser](https://www.npmjs.com/package/terser) package description is an excellent overview.

### Minify template literals {#minify-template-literals}

Lit-html templates are defined using template literals, which don't get processed by standard HTML minifiers. Adding a plugin that minifies template literals can result in a modest decrease in code size. (Unless your templates are very large, this is a small optimization).

Several packages are available to perform this optimization:

*   Rollup: [rollup-plugin-minify-html-literals](https://www.npmjs.com/package/rollup-plugin-minify-html-literals?activeTab=readme)
*   Webpack: [minify-template-literal-loader](https://www.npmjs.com/package/minify-template-literal-loader)


### Compile out the shady-render module {#compile-out-the-shady-render-module}

If you're building for modern browsers only, you can remove LitElement's built-in support for shady DOM, the shadow DOM polyfill, saving about 12KB of bundle size.

To do so, configure your build system to replace the `shady-render` module with the base `lit-html` module, which provides a generic version of `render`. This saves about 12KB from your bundle.

For a Rollup build:

1.  Install the `alias` plugin.

    ```bash
    npm i -D @rollup/plugin-alias
    ```

2.  Configure the alias plugin to replace references to the `shady-render` module with references to the main `lit-html` module. 

    ```js
    alias({
      entries: [{
        find: 'lit-html/lib/shady-render.js',
        replacement: 'node_modules/lit-html/lit-html.js'
      }]
    }),
    ```

For a webpack build:

*   Add the following resolve.alias setting to your webpack configuration:

    ```js
    resolve: {
      alias: {
        'lit-html/lib/shady-render.js': path.resolve(__dirname, './node_modules/lit-html/lit-html.js')
      }
    },
    ```

## TypeScript {#typescript}

The TypeScript language extends JavaScript by adding types and type checking. The TypeScript compiler, `tsc`, compiles TypeScript into standard JavaScript.

While it's possible to run the TypeScript compiler as part of the bundling process, we recommend running it separately, to generate an intermediate JavaScript version of your project. Because of issues with the TypeScript compiler's output for older browsers. **We recommend configuring TypeScript to output modern JavaScript (ES2017 target and ES modules).** 

For example, if you have a `tsconfig.json` file, you'd include the following options to output modern JavaScript:

```json
{
  "compilerOptions": {
    "target": "es2017",
    "module": "es2015",
    ...
```

Use this intermediate version as input to your build tools. To support older browsers, use Babel to recompile the intermediate, modern JavaScript version into backward-compatible JavaScript, as described in [Transpiling to ES5](#transpiling-to-es5) and [Transforming modules](#transforming-modules).
