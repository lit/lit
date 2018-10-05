---
layout: post
title: Getting Started
slug: getting-started
---

{::options toc_levels="1..2" /}
* ToC
{:toc}

## Installation

### npm

lit-htm is distributed on npm, in the [lit-html package].

```
npm install lit-html
```

### unpkg.com

lit-html is also loadable directly from the unpkg.com CDN:

```js
import {html, render} from 'https://unpkg.com/lit-html?module';
```

## Importing

lit-html is written in and distributed as standard JavaScript modules.
Modules are increasingly supported in JavaScript environments and are shipping in Chrome, Opera and Safari, and soon will be in Firefox and Edge.

To use lit-html, import it via a path:

```js
import {html, render} from './node_modules/lit-html/lit-html.js';
```

The path to use depends on where you've installed lit-html to. Browsers only support importing other modules by path, not by package name, so without other tools involved, you'll have to use paths.

If you use a tool that converts package names into paths, then you can import by path:

```js
import {html, render} from 'lit-html';
```

## Rendering a Template

lit-html has two main APIs:

* The `html` template tag used to write templates
* The `render()` function used to render a template to a DOM container.

```ts
// Import lit-html
import {html, render} from 'lit-html';

// Define a template
const myTemplate = (name) => html`<p>Hello ${name}</p>`;

// Render the template to the document
render(myTemplate('World'), document.body);
```

To learn more about templates, see [Writing Templates](./writing-templates.html).

### Why is lit-html distributed as JavaScript modules, not as UMD/CJS/AMD?

Until modules arrived, browsers have not had a standard way to import code from code, and user-land module loaders or bundlers were required. Since there was no standard, competing formats multiplied. Often libraries will publish in a number of formats to support users of different tools, but this causes problems when a common library is depended on by many other intermediate libraries: If some of those intermediate libraries load format A, and others load format B, and yet others load format C, etc., then multiple copies are loaded cause bloat, performance slowdowns, and sometimes hard-to-find bugs.

The only true solution is to have one canonical version of a library that all other libraries import. Since modules support is rolling out to browsers now, and modules are very well supported by tools, it makes sense for that format to be modules.

[lit-html package]: https://www.npmjs.com/package/lit-html
