---
title: Getting Started
---

# Getting Started

## Installation

### npm

lit-htm is distributed on npm, in the [lit-html package].

```
npm install lit-html
```

### unpkg.com

lit-html is also loadable directly from the unpkg.com CDN:

```js
import {html, render} from 'https://unpkg.com/lit-html/lib/lit-extended.js?module';
```

## Importing

lit-html is written in and distributed as standard JavaScript modules.
Modules are increasingly supported in JavaScript environments and are shipping in Chrome, Opera and Safari, and soon will be in Firefox and Edge.

To use lit-html, import it via a path:

```js
import {html, render} from './node_modules/lit-html/lib/lit-extended.js';
```

The path to use depends on where you've installed lit-html to. Browsers only support importing other modules by path, not by package name, so without other tools involved, you'll have to use paths.

If you use some tool than can convert package names into paths, then you can import by path:

```js
import {html, render} from 'lit-html/lib/lit-extended.js';
```


### Why is lit-html distributed as JavaScript modules, not as XXX?

Until modules arrived, browsers have not had a standard way to import code from code, and user-land module loaders or bundlers were required. Since there was no standard, competing formats multiplied. Often libraries will publish in a number of formats to support users of different tools, but this causes problems when a common library is depended on by many other intermediate libraries: If some of those intermediate libraries load format A, and others load format B, and yet others load format C, etc., then multiple copies are loaded cause bloat, performance slowdowns, and sometimes hard-to-find bugs.

The only true solution is to have one canonical version of a library that all other libraries import. Since modules support is rolling out to browsers now, and moduels are very well supported by tools, it makes for that format to be modules.

[lit-html package]: https://www.npmjs.com/package/lit-html
