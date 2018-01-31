---
title: Introduction
---

# Introduction

## What is lit-html?

lit-html is a simple, modern, safe, small and fast HTML templating library for JavaScript.

lit-html lets you write HTML templates in JavaScript using [template literals] with embedded JavaScript expressions. Behind the scenes lit-html creates HTML `<template>` elements from your JavaScript templates and processes them so that it knows exactly where to insert and update the values from expressions.

## lit-html Templates

lit-html templates are tagged template literals - they look like JavaScript strings but are enclosed in backticks (`` ` ``) instead of quotes - and tagged with lit-html's `html` tag:

```js
html`<h1>Hello ${name}</h1>`
```

Since lit-html templates almost always need to merge in data from JavaScript values, and be able to update DOM when that data changes, they'll most often be written within functions that take some data and return a lit-html template, so that the function can be called multiple times:

```js
let myTemplate = (data) => html`
  <h1>${data.title}</h1>
  <p>${data.body}</p>`;
```

lit-html is _lazily_ rendered. Calling this function will evaluate the template literal using lit-html `html` tag, and return a `TemplateResult` - a record of the template to render and data to render it with. `TemplateResults` are very cheap to produce and no real work actually happens until they are _rendered_ to the DOM.

## Rendering

To render a `TempalteResult`, call the `render()` function with a result and DOM container to render to:

```js
const result = myTemplate({title: 'Hello', body: 'lit-html is cool'});
render(result, document.body);
```

## Template Dialects: lit-html vs lit-extended

lit-html allows extensive customization of template features and syntax through what are called "part callbacks". lit-html includes a core and very un-opinionated template dialect in the `lit-html.js` module which only supports the basic features of HTML: attributes and text content.

```js
import {html} from 'lit-html';

let result = html`<p>This template only supports attributes and text</p>`;
```

lit-html also includes a module at `lib/lit-extended.js` which implements a more opinionated, feature-rich dialect called inspired by Polymer's template syntax. It sets properties instead of attributes by default and allows for declarative event handlers, attributes and boolean attributes.

```js
import {html} from 'lit-html/lib/lit-extended.js';

let result = html`
  <p>
    This template sets properties by default, which is great for custom elements:

      <my-element items=${[1, 2, 3]}></my-element>

    Attributes can be set with a $ suffix on the attribute name:

      <p class$="important">I have class</p>

    Events can be added with on- prefixed attribute names:

      <button on-click=${(e) => window.alert('clicked')}>Click Me</button>

    Boolean attributes can be toggled by adding a ? suffix:

      <span hidden?=${hide}>I'm not hidden</span>
  </p>`;
```

In lit-html the type of template you write is determined by the `html` tag you use. If you import `html` from `lit-html.js`, you're using the basic core library. If you import `html` from `lib/lit-extended.js`, you're using lit-extended.

You can mix and match templates using different dialects and they will behave as intended.

[template literals]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals
