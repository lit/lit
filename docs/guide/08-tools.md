---
title: Tools
slug: tools
---

lit-html is available from the npm registry. If you're already using npm to manage dependencies, you can use lit-html much like any other JavaScript library you install from npm. This section describes some additional tools or plugins you might want to add to your workflow to make it easier to work with lit-html.

lit-html is delivered as a set of JavaScript modules. If you aren't already using JavaScript modules in your project, you may need to add a couple of steps to your development and build workflow.


## Setup

The simplest way to add lit-html to a project is to install it from the npm registry. 

1. If you're starting a brand-new project, run the following command in your project area to set up npm:

    ```bash
    npm init
    ```

    Respond to the prompts to set up your project. You can hit return to accept the default values.

2. Install lit-html.

    ```bash
    npm i lit-html
    ```


3. If you're working on a project with many front-end dependencies, you may want to use the npm  `dedupe` command to try and reduce duplicated modules:

    `npm dedupe` 

## Development

During the development phase, you might want the following tools:

* IDE plugins, for linting and code highlighting.
* Linter plugins, for checking lit-html templates.
* A dev server, for previewing code without a build step.


### IDE plugins

There are a number of IDE plugins that may be useful when developing with lit-html. In particular, we recommend using a code highlighter that works with lit-html style templates. In addition, we recommend using a linter like ESLint that supports modern JavaScript.

The following VS Code and TypeScript plugins check lit-html templates for errors:

* [VS Code plugin](https://marketplace.visualstudio.com/items?itemName=runem.lit-plugin)

* [TypeScript plugin (works with Sublime and Atom)](https://github.com/runem/lit-analyzer/tree/master/packages/ts-lit-plugin)

More plugins

The [awesome-lit-html](https://github.com/web-padawan/awesome-lit-html#ide-plugins) repo lists other IDE plugins.


### Linting

ESLint is recommended for linting lit-html code.  The following ESLint plugin can be added to check for some common issues in lit-html templates:

* [https://github.com/43081j/eslint-plugin-lit](https://github.com/43081j/eslint-plugin-lit)

Another alternative is to use the `lit-analyzer` CLI alongside ESLint to detect issues in your lit-html templates:

* [https://github.com/runem/lit-analyzer/tree/master/packages/lit-analyzer](https://github.com/runem/lit-analyzer/tree/master/packages/lit-analyzer)

`lit-analyzer` uses the same backend as the VS Code and TypeScript plugins listed in [IDE plugins](#ide-plugins).

### Dev server

lit-html is packaged as JavaScript modules. Many developers prefer to import modules using bare module specifiers:

```js
import {html, render} from 'lit-html';
```

To run in the browser, the bare identifier ('lit-html') needs to be transformed to a path or URL that the browser can load (such as '/node_modules/lit-html/lit-html.js'). [ES dev server](https://open-wc.org/developing/es-dev-server.html) is an open-source dev server that handles this and other transforms.

You can also use the Polymer CLI dev server, if you already have it installed. For new projects, we recommend the ES dev server.

If you already have a dev server that integrates with your build process, you can use that, instead.

#### ES Dev Server

The ES dev server enables a build-free development process. It handles rewriting bare module specifiers to valid paths or URLs, as required by the browser. For IE11, ES dev server also transforms JavaScript modules to use the backwards-compatible SystemJS module loader. 

Install ES dev server:

```bash
npm i -D es-dev-server
```

Add a command to your `package.json` file:

```json
"scripts": {
  "start": "es-dev-server --app-index index.html --node-resolve --watch --open"
}
```

Run the dev server:

```bash
npm run start
```

For full installation and usage instructions, see the [open-wc website](https://open-wc.org/developing/es-dev-server.html). 

## Testing

lit-html doesn't have many special testing requirements. If you already have a testing setup, it should work fine as long as it supports working with JavaScript modules (and node-style module specifiers, if you use them).

Web Component Tester (WCT) is an end-to-end testing environment that supports node-style module specifiers. works with the Mocha testing framework and (optionally) the Chai assertion library. There are two ways to add WCT to your project:

* [web-component-tester](https://www.npmjs.com/package/web-component-tester).  Installing the full WCT package gives you Mocha and Chai, as well as some other add-ons.
* [wct-mocha](https://www.npmjs.com/package/wct-mocha). Just the WCT client-side library. You'll need to install your own version of Mocha, and any other add-ons you want.

Alternately, you can also use the Karma test runner. The Open Web Components recommendations includes a [Karma setup](https://open-wc.org/testing/testing-karma.html#browser-testing) that resolves module dependencies by bundling with webpack before running tests. 

## Build

Build tools take your code and make it production-ready. Among the things you may need build tools to do:

* Bundle modules together to improve performance by reducing the number of files that need to be transferred. 
* Minify JavaScript, HTML, and CSS.
* Transform code for legacy browsers: compile ES6 code to ES5, and transform JavaScript modules into other formats.
* Add required polyfills (may be done manually).

Many build tools can do this for you. Currently we recommend Rollup, and provide a [sample project using Rollup](https://github.com/PolymerLabs/lit-html-build). 

If you're using another tool or creating your own Rollup configuration, see the section on [Build considerations](#build-consderations).

For more details on the build steps, see the LitElement [Build for production](https://lit-element.polymer-project.org/guide/build) guide. lit-html has the same requirements as LitElement, except that lit-html requires only the [Template polyfill](#template-polyfill), not the full Web Components polyfills.

### Build your project with Rollup

Rollup works well with lit-html. The [lit-html-build](https://github.com/PolymerLabs/lit-html-build) repository is a simple example project using lit-html with a Rollup build.

For more information on the build steps, see the LitElement [Build for production](https://lit-element.polymer-project.org/guide/build) guide.

open-wc also has [Rollup build resources](https://open-wc.org/building/building-rollup.html). 

### Build your project with webpack

webpack is a powerful build tool with a large ecosystem of plugins. 

See the open-wc default webpack configuration provides a great starting point for building projects that use lit-html. See their [webpack page](https://github.com/open-wc/open-wc/tree/master/packages/building-webpack) for instructions on getting started. 

### Build considerations  {#build-considerations}

If you're creating your own configuration for webpack, Rollup, or another tool, here are some factors to consider:

* ES6 to ES5 compilation.
* Transforming JavaScript modules to other formats for legacy browsers.
* lit-html template minification.
* Polyfills.

For more details on these considerations, see the LitElement [Build for production](https://lit-element.polymer-project.org/guide/build) guide. lit-html has the same requirements as LitElement, except that lit-html requires only the [Template polyfill](#template-polyfill), not the full Web Components polyfills.

#### Compilation and module transform {#transpilation-and-module-transform}

To support legacy browsers, your build tools need to compile ES6 features to ES5. In general, ES6 is faster than the ES5 equivalent, so try to serve ES6 to browsers that support it.

Your build tools need to accept JavaScript modules (also called ES modules) and transform them to another module format, such as SystemJS, if necessary. If you use node-style module specifiers, your build will also need to transform them to browser-ready modules specifiers. 

If you're working in TypeScript, the TypeScript compiler, `tsc`, can generate different output for different browsers. However, there are known issues with the compiled output for older browsers. **We recommend configuring TypeScript to output modern JavaScript (ES2017 target and ES modules) and using Babel to compile the output for older browsers.** 

For example, if you have a `tsconfig.json` file, you'd include the following options to output modern JavaScript:

```json
{
  "compilerOptions": {
    "target": "es2017",
    "module": "es2015",
    ...
```

#### Template minification

As part of the build process, you'll probably want to minify the HTML templates. Most HTML minifiers don't support HTML inside template literals, as used by lit-html, so you'll need to use a build plugin that supports minifying lit-html templates. Minifying lit-html templates can improve performance by reducing the number of nodes in a template. 

* [Babel plugin](https://github.com/cfware/babel-plugin-template-html-minifier). For build chains that use Babel for compilation. The open-wc webpack default configuration uses this plugin.
* [Rollup plugin](https://github.com/asyncLiz/rollup-plugin-minify-html-literals). If you're building your own Rollup configuration.

Template minification is a fairly small optimization compared to other common optimizations like JavaScript minification, bundling, and compression. 

#### Template polyfill

To run on Internet Explorer 11, which doesn't support the `<template>` element, you'll need a polyfill. You can use the template polyfill included with the Web Components polyfills.

Install the template polyfill:

```bash
npm i @webcomponents/template
```

Use the template polyfill:

```html
<script src="./node_modules/@webcomponents/template/template.js"></script>
```

Note: when transpiling for IE11, the Babel polyfills need to be bundled separately from the application code, and loaded *before* the template polyfill. This is demonstrated in the [`index-prod.html`](https://github.com/PolymerLabs/lit-html-build/blob/master/index-prod.html) file in the Rollup sample project.

