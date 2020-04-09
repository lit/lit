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

VSCode plugin

* https://marketplace.visualstudio.com/items?itemName=bierner.lit-html

TypeScript plugin (works with Sublime and Atom)

* https://github.com/Microsoft/typescript-lit-html-plugin

More plugins

The [awesome-lit-html](https://github.com/web-padawan/awesome-lit-html#ide-plugins) repo lists other IDE plugins.


### Linter plugins

ESLint is recommended for linting lit-html code. The following ESLint plugin can be added to check for some common issues in lit-html templates:

* [https://github.com/43081j/eslint-plugin-lit](https://github.com/43081j/eslint-plugin-lit)

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

* Transform ES6 code to ES5 for legacy browsers, including transforming JavaScript modules into other formats.
* Bundle modules together can improve performance by reducing the number of files that need to be transferred. 
* Minify JavaScript, HTML, and CSS.

Many build tools can do this for you. Currently we recommend the Polymer CLI or webpack. 

The Polymer CLI includes a set of build tools that can handle lit-html with minimal configuration.

webpack is a powerful build tool with a large ecosystem of plugins. The [Open Web Components](https://open-wc.org/building/#webpack) project provides a default configuration for webpack that works well for lit-html and LitElement.

Other tools such as Rollup can work, too. If you're using another tool or creating your own webpack configuration, see the section on [Build considerations for other tools](#build-consderations).

### Build your project with Polymer CLI

Originally developed to work with the Polymer library, the Polymer CLI can handle build duties for a variety of projects. It's not as flexible and extensible as webpack or Rollup, but it requires minimal configuration.

To build your project with the Polymer CLI, first install the Polymer CLI:

`npm i -g polymer-cli`

Create a `polymer.json` file in your project folder. A simple example would look like this:

```json
{
  "entrypoint": "index.html",
  "shell": "src/myapp.js",
  "sources": [
    "src/**.js",
    "manifest/**",
    "package.json"
  ],
  "extraDependencies": [
    "node_modules/@webcomponents/webcomponentsjs/bundles/**"
  ],
  "builds": [
    {"preset": "es6-bundled"}
  ]
}
```

This configuration specifies that the app has an HTML entrypoint called `index.html`, has a main JavaScript file (app shell) called `src/myapp.js`. It will produce a single build, bundled but not transpiled to ES5. For details on the polymer.json file, see [polymer.json specification](https://polymer-library.polymer-project.org/3.0/docs/tools/polymer-json) on the Polymer library site.

To build the project, run the following command in your project folder:

`polymer build`

For more on building with Polymer CLI, see [Build for production](https://polymer-library.polymer-project.org/3.0/docs/apps/build-for-production) in the Polymer library docs.

### Build your project with webpack


See the Open Web Components default webpack configuration provides a great starting point for building projects that use lit-html. See their [webpack page](https://open-wc.org/building/building-webpack.html#default-configuration) for instructions on getting started. 

### Build considerations for other tools {#build-considerations}


If you're creating your own configuration for webpack, Rollup, or another tool, here are some factors to consider:

* ES6 to ES5 transpilation.
* Transforming JavaScript modules to other formats for legacy browsers.
* lit-html template minification.

#### Transpilation and module transform

You build tools need to transpile ES6 features to ES5 for legacy browsers. 

If you're working in TypeScript, the TypeScript compiler can generate different output for different browsers.

* In general, ES6 is faster than the ES5 equivalent, so try to serve ES6 to browsers that support it.
* TypeScript has slightly buggy template literal support when compiling to ES5, which can hurt performance.

Your build tools need to accept JavaScript modules (also called ES modules) and transform them to another module format, such as UMD, if necessary. If you use node-style module specifiers, your build will also need to transform them to browser-ready modules specifiers. 

#### Template minification

As part of the build process, you'll probably want to minify the HTML templates. Most HTML minifiers don't support HTML inside template literals, as used by lit-html, so you'll need to use a build plugin that supports minifying lit-html templates. Minifying lit-html templates can improve performance by reducing the number of nodes in a template.

* [Babel plugin](https://github.com/cfware/babel-plugin-template-html-minifier). For build chains that use Babel for transpilation. The open-wc webpack default configuration uses this plugin.
* [Rollup plugin](https://github.com/asyncLiz/rollup-plugin-minify-html-literals). If you're building your own Rollup configuration.
