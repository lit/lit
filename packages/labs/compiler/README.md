# @lit-labs/compiler

A compiler for optimizing Lit templates.

> **Warning** `@lit-labs/compiler` is part of the Lit Labs set of packages – it is published
> in order to get feedback on the design and may receive breaking changes.
> RFC: https://github.com/lit/rfcs/pull/21
>
> Give feedback: https://github.com/lit/lit/discussions/4117

## Overview

`@lit-labs/compiler` exports a [TypeScript
Transformer](https://github.com/itsdouges/typescript-transformer-handbook#the-basics)
that can be run over your JavaScript or TypeScript files to optimize away the
[`lit-html` **prepare** render phase](https://github.com/lit/lit/blob/main/dev-docs/design/how-lit-html-works.md#rendering). For template heavy applications this can result in a quicker first render.

## Usage

This transformer can be used anywhere TypeScript transformers are accepted, which is dependent on your build setup.

Below is an example using [Rollup](https://rollupjs.org/) with the plugin [`@rollup/plugin-typescript`](https://www.npmjs.com/package/@rollup/plugin-typescript):

```js
// File: rollup.config.js
import typescript from '@rollup/plugin-typescript';
import {compileLitTemplates} from '@lit-labs/compiler';

export default {
  // ...
  plugins: [
    typescript({
      transformers: {
        before: [compileLitTemplates()],
      },
    }),
    // other rollup plugins
  ],
};
```

See an example of the transformer in use in this project's test for source-maps validity in this [rollup config file](https://github.com/lit/lit/blob/main/packages/labs/compiler/rollup.source_map_tests.js).

# FAQ

## What are the tradeoffs for using the compiler?

1. Running the compiler requires a build step that can accept a TypeScript transformer.

2. The very first template render is faster (sometimes up to 45% faster for template heavy pages), but currently the output file is about 5% larger (gzipped).

## How do I know optimizations have been applied?

Given your original source code containing the `html` tag function to declare templates:

```js
const hi = (name) => html`<h1>Hello ${name}!</h1>`;
```

This code should have been emitted at the end of your build without the `html` tag function.
E.g. the above authored example is transformed into something like:

```js
const b = (s) => s;
const lit_template_1 = {h: b`<h1>Hello <?></h1>`, parts: [{type: 2, index: 1}]};
const hi = (name) => ({_$litType$: lit_template_1, values: [name]});
```

## What templates are optimized by the compiler?

In order for a template to be optimized by the compiler, it must be:

1. A well-formed template that wouldn't raise runtime diagnostics in development builds of lit-html. For example, templates with expressions in [invalid locations](https://lit.dev/docs/templates/expressions/#invalid-locations) will not be compiled.
1. Use `html` imported directly from the module `lit` or `lit-html`. Re-exports of `html` from other modules are not supported. The following imports are supported:
   1. `import {html} from 'lit';` Usage: `` html`...` ``
   1. `import {html as litHtml} from 'lit';` Usage: `` litHtml`...` ``
   1. `import * as litModule from 'lit'` Usage: `` litModule.html`...` ``
1. Cannot contain dynamic bindings within the raw text elements: `textarea`, `title`, `style`, and `script`. This is due to these elements containing raw text nodes as children & the limitation that raw text nodes cannot be placed as adjacent children in HTML markup.

## Does the compiler work on JavaScript files?

Because JavaScript is a subset of TypeScript, the TypeScript transform has been implemented and tested such that it handles JavaScript.

You will need to run the compiler transformer over your JavaScript files.

# Future work

- Investigate if it's possible to reduce the file size increase on the compilers
  output.
- Expand compilation so the complete optimization of a lit application can also
  tree-shake the relevant `lit-html` runtime that is no longer needed.
- Explore more optimizations than just the prepare phase.
- Provide different ways of consuming and using the compiler.
