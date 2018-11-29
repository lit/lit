---
layout: post
title: Concepts
slug: concepts
---

{::options toc_levels="1..2" /}
* ToC
{:toc}

`lit-html` utilizes some unique properties of JavaScript template literals and HTML `<template>` elements to function and achieve fast performance. So it's helpful to understand them first.

## Tagged Template Literals

A JavaScript template literal is a string literal that can have JavaScript expressions embedded in it:

```js
`My name is ${name}.`
```

The literal uses backticks instead of quotes, and can span multiple lines. The part inside the `${}` can be _any_ JavaScript expression.

A _tagged_ template literal is prefixed with a special template tag function:

```js
let name = 'Monica';
tag`My name is ${name}.`
```

Tags are functions that take the literal strings of the template and values of the embedded expressions, and return a new value. This can be any kind of value, not just strings. lit-html returns an object representing the template, called a `TemplateResult`.

The key features of template tags that lit-html utilizes to make updates fast is that the object holding the literals strings of the template is _exactly_ the same for every call to the tag for a particular template.

This means that the strings can be used as a key into a cache so that lit-html can do the template preparation just once, the first time it renders a template, and updates skip that work.

## HTML `<template>` Elements

A `<template>` element is an inert fragment of DOM. Inside a `<template>`, script don't run, images don't load, custom elements aren't upgraded, etc. `<template>`s can be efficiently cloned. They're usually used to tell the HTML parser that a section of the document must not be instantiated when parsed, and will be managed by code at a later time, but it can also be created imperatively with `createElement` and `innerHTML`.

lit-html creates HTML `<template>` elements from the tagged template literals, and then clones them to create new DOM.

## Template Creation

The first time a particular lit-html template is rendered anywhere in the application, lit-html does one-time setup work to create the HTML template behind the scenes. It joins all the literal parts with a special placeholder, similar to `"{% raw %}{{}}{% endraw %}"`, then creates a `<template>` and sets its `innerHTML` to the result.

If we start with a template like this:

```js
let header = (title) => html`<h1>${title}</h1>`;
```

lit-html will generate the following HTML:

```html
<h1>{% raw %}{{}}{% endraw %}</h1>
```

And create a `<template>` from that.

Then lit-html walks the template's DOM and extracts the placeholders and records their location. The final template doesn't contain the placeholders:

```html
<h1></h1>
```

And there's an auxillary table of where the expressions were:

`[{type: 'node', index: 1}]`

## Template Rendering

`render()` takes a `TemplateResult` and renders it to a DOM container. On the initial render it clones the template, then walks it using the remembered placeholder positions, to create `Part` objects.

A `Part` is a "hole" in the DOM where values can be injected. lit-html includes two type of parts by default: `NodePart` and `AttributePart`, which let you set text content and attribute values respectively. The `Part`s, container, and template they were created from are grouped together in an object called a `TemplateInstance`.

## Thinking Functionally

lit-html is ideal for use in a functional approach to describing UIs. If you think of UI as a function of data, commonly expressed as `UI = f(data)`, you can write lit-html templates that mirror this exactly:

```js
let ui = (data) => html`...${data}...`;
```

This kind of function can be called any time data changes, and is extremely cheap to call. The only thing that lit-html does in the `html` tag is forward the arguments to the templates.

When the result is rendered, lit only updates the expressions whose values have changed since the previous render.

This leads to model that's easy to write and easy to reason about: always try to describe your UI as a simple function of the data it depends on, an avoid caching intermediate state, or doing manual DOM manipulation. lit-html will almost always be fast enough with the simplest description of your UI.

## JavaScript Modules

Why is lit-html distributed as JavaScript modules, not as UMD/CJS/AMD?

Until modules arrived, browsers have not had a standard way to import code from code, so user-land module loaders or bundlers were required. Since there was no standard, competing formats have multiplied. Often libraries  publish in a number of formats to support users of different tools, but this causes problems when a common library is depended on by many other intermediate libraries. If some of those intermediate libraries load format A, and others load format B, and yet others load format C, then multiple copies are loaded, causing bloat, performance slowdowns, and sometimes hard-to-find bugs.

The only true solution is to have one canonical version of a library that all other libraries import. Since modules support is rolling out to browsers now, and modules are very well supported by tools, it makes sense for that format to be modules.

For more information on JavaScript modules:

*   [Using JavaScript Modules on the Web](https://developers.google.com/web/fundamentals/primers/modules) on Web Fundementals.

*   [import statement reference page](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/import) on MDN.
