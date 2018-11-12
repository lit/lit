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

You can also load lit-html directly from the unpkg.com CDN:

```js
import {html, render} from 'https://unpkg.com/lit-html?module';
```

### Online editors

You can try out lit-html without installing anything using an online editor. Below are links to a simple lit-html starter project in some popular online editors:

*   [CodeSandbox](https://codesandbox.io/s/wq2wm73o28)
*   [JSBin](https://jsbin.com/nahocaq/1/edit?html,output)
*   [StackBlitz](https://stackblitz.com/edit/js-pku9ae?file=index.js)

## Importing

lit-html is written in and distributed as standard JavaScript modules.
Modules are increasingly supported in JavaScript environments and are shipping in Chrome, Opera and Safari, and soon will be in Firefox and Edge.

To use lit-html, import it via a path:

```js
<script type="module">
  import {html, render} from './node_modules/lit-html/lit-html.js';
  ...
</script>
```

The JavaScript `import` statement only works inside module scripts (`<script type="module">`), which can be inline scripts (as shown above) or external scripts.

The path to use depends on where you've installed lit-html to. Browsers only support importing other modules by path, not by package name, so without other tools involved, you'll have to use paths.

If you use a tool that converts package names into paths, then you can import by package name:

```js
import {html, render} from 'lit-html';
```

**Why JavaScript modules?** For more information on why lit-html is distributed using JavaScript modules, see [JavaScript Modules](concepts#javascript-modules).

## Rendering a Template

lit-html has two main APIs:

*   The `html` template tag used to write templates
*   The `render()` function used to render a template to a DOM container.

```ts
// Import lit-html
import {html, render} from 'lit-html';

// Define a template
const myTemplate = (name) => html`<p>Hello ${name}</p>`;

// Render the template to the document
render(myTemplate('World'), document.body);
```

To learn more about templates, see [Writing Templates](./writing-templates).

[lit-html package]: https://www.npmjs.com/package/lit-html
