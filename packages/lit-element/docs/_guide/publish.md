---
layout: guide
title: Publish an element
slug: publish
---

{::options toc_levels="1..3" /}
* ToC
{:toc}

This page describes how to publish a LitElement component to npm.

We recommend publishing JavaScript modules in standard ES2017. If you're writing your element in standard ES2017, you don't need to transpile for publication. If you're using TypeScript, or ES2017+ features such as decorators or class fields, you will need to transpile your element for publication.

## Publishing to npm

To publish your component to npm, [see the instructions on contributing npm packages](https://docs.npmjs.com/packages-and-modules/contributing-packages-to-the-registry).

Your package.json configuration should have both the `main` and `module` fields:

**package.json**

```json
{
  "main": "my-element.js",
  "module": "my-element.js"
}
```

You should also create a README describing how to consume your component. A basic guide to consuming LitElement components is documented at [Use a component](use).

## Transpiling with TypeScript

When compiling your code from TypeScript to JavaScript, we recommend targeting ES2017 with Node.js module resolution.

The following JSON sample is a partial tsconfig.json that uses recommended options for targeting ES2017:

```json
  "compilerOptions": {
    "target": "es2017",
    "module": "es2015",
    "moduleResolution": "node",
    "lib": ["es2017", "dom"],
    "experimentalDecorators": true
  }
```

See the [tsconfig.json documentation](https://www.typescriptlang.org/docs/handbook/tsconfig-json.html) for more information.

## Transpiling with Babel

To transpile a LitElement component that uses proposed JavaScript features, use Babel.

Install Babel and the Babel plugins you need. For example:

```
npm install --save-dev @babel/core
npm install --save-dev @babel/plugin-proposal-class-properties
npm install --save-dev @babel/plugin-proposal-decorators
```

Configure Babel. For example:

**babel.config.js**

```js
const plugins = [
  '@babel/plugin-proposal-class-properties',
  ['@babel/plugin-proposal-decorators', { decoratorsBeforeExport: true } ],
];

module.exports = { plugins };
```

You can run Babel via a bundler plugin such as [rollup-plugin-babel](https://www.npmjs.com/package/rollup-plugin-babel), or from the command line. See the [Babel documentation](https://babeljs.io/docs/en/) for more information.
