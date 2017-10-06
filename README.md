# lit-html
HTML templates, via JavaScript template literals

[![Build Status](https://travis-ci.org/PolymerLabs/lit-html.svg?branch=master)](https://travis-ci.org/PolymerLabs/lit-html)

## Overview

`lit-html` lets you write [HTML templates](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/template) with JavaScript [template literals](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals), and efficiently render and _re-render_ those templates to DOM.

```javascript
import {html, render} from 'lit-html';

// This is a lit-html template function. It returns a lit-html template.
const helloTemplate = (name) => html`<div>Hello ${name}!</div>`;

// Call the function with some data, and pass the result to render()

// This renders <div>Hello Steve!</div> to the document body
render(helloTemplate('Steve'), document.body);

// This updates to <div>Hello Kevin!</div>, but only updates the ${name} part
render(helloTemplate('Kevin'), document.body);
```

`lit-html` provides two main exports:

 * `html`: A JavaScript [template tag](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals#Tagged_template_literals) used to produce a `TemplateResult`, which is a container for a template, and the values that should populate the template.
 * `render()`: A function that renders a `TemplateResult` to a DOM container, such as an element or shadow root.

### Announcement at Polymer Summit 2017

<p align="center">
  <a href="https://www.youtube.com/watch?v=ruql541T7gc">
    <img src="https://img.youtube.com/vi/ruql541T7gc/0.jpg" width="256" alt="Efficient, Expressive, and Extensible HTML Templates video">
    <br>
    Efficient, Expressive, and Extensible HTML Templates video
  </a>
</p>

## Motivation

`lit-html` has four main goals:

1. Efficient updates of previously rendered DOM.
2. Expressiveness and easy access to the JavaScript state that needs to be injected into DOM.
3. Standard JavaScript without required build steps, understandable by standards-compliant tools.
4. Very small size.

## How it Works

`lit-html` utilizes some unique properties of HTML `<template>` elements and JavaScript template literals. So it's helpful to understand them first.

### Tagged Template Literals

A JavaScript template literal is a string literal that can have other JavaScript expressions embedded in it:

```javascript
`My name is ${name}.`
```

A _tagged_ template literal is prefixed with a special template tag function:

```javascript
let name = 'Monica';
tag`My name is ${name}.`
```

Tags are functions of the form: `tag(strings, ...values)`, where `strings` is an immutable array of the literal parts, and values are the results of the embedded expressions.

In the preceding example, `strings` would be `['My name is ', '.']`, and `values` would be `['Monica']`.

### HTML `<template>` Elements

A `<template>` element is an inert tree of DOM (script don't run, images don't load, custom elements aren't upgraded, etc) that can be efficiently cloned. It's usually used to tell the HTML parser that a section of the document must not be instantiated when parsed, but by code at a later time, but it can also be created imperatively with `createElement` and `innerHTML`.

### Template Creation

The first time `html` is called on a particular template literal it does one-time setup work to create the template. It joins all the string parts with a special placeholder, `"{{}}"`, then creates a `<template>` and sets its `innerHTML` to the result. Then it walks the template's DOM and extracts the placeholder and remembers their location.

Every call to `html` returns a `TemplateResult` which contains the template created on the first call, and the expression values for the current call.

### Template Rendering

`render()` takes a `TemplateResult` and renders it to a DOM container. On the initial render it clones the template, then walks it using the remembered placeholder positions, to create `Part`s.

A `Part` is a "hole" in the DOM where values can be injected. `lit-html` includes two type of parts by default: `NodePart` and `AttributePart`, which let you set text content and attribute values respectively. The `Part`s, container, and template they were created from are grouped together in an object called a `TemplateInstance`.

Rendering can be customized by providing alternate `render()` implementations which create different kinds of `TemplateInstances` and `Part`s, like `PropertyPart` and `EventPart` included in `lib/lit-extended.ts` which let templates set properties and event handlers on elements.

## Performance

`lit-html` is designed to be lightweight and fast (though performance benchmarking is just starting).

 * It utilizes the built-in JS and HTML parsers - it doesn't include any expression or markup parser of it's own.
 * It only updates the dynamic parts of templates - static parts are untouched, not even walked for diffing, after the initial render.
 * It uses cloning for initial render.

This should make the approach generally fast and small. Actual science and optimization and still TODOs at this time.

## Features

### Simple expressions and literals

Anything coercible to strings are supported:

```javascript
const render = () => html`foo is ${foo}`;
```

### Attribute-value Expressions

```javascript
const render = () => html`<div class="${blue}"></div>`;
```

### SVG Support

To create partial SVG templates - template that will rendering inside and `<svg>` tag (in the SVG namespace), use the `svg` template tag instead of the `html` template tag:

```javascript
const grid = svg`
  <g>
    ${[0, 10, 20].map((x) => svg`<line x1=${x} y1="0" x2=${x} y2="20"/>`)}
    ${[0, 10, 20].map((y) => svg`<line x1="0" y1=${y} x2="0" y2=${y}/>`)}
  </g>
`;
```

### Safety

Because `lit-html` templates are parsed before values are set, they are safer than generating HTML via string-concatenation. Attributes are set via `setAttribute()` and node text via `textContent`, so the structure of template instances cannot be accidentally changed by expression values, and values are automatically escaped.

_TODO: Add sanitization hooks to disallow inline event handlers, etc._

### Case-sensitive Attribute Names

Attribute parts store both the HTML-parsed name and the raw name pulled from the string literal. This allows extensions, such as those that might set properties on elements using attribute syntax, to get case-sensitive names.

```javascript
const render = () => html`<div someProp="${blue}"></div>`;
render().template.parts[0].rawName === 'someProp';
```

### Arrays/Iterables

```javascript
const items = [1, 2, 3];
const render = () => html`items = ${items.map((i) => `item: ${i}`)}`;
```

```javascript
const items = {
  a: 1,
  b: 23,
  c: 456,
};
const render = () => html`items = ${Object.entries(items)}`;
```

### Nested Templates

```javascript
const header = html`<h1>${title}</h1>`;
const render = () => html`
  ${header}
  <p>And the body</p>
`;
```

### Directives

Directives are functions that can extend lit-html by directly interacting with the Part API.

Directives will usually be created from factory functions that accept some arguments for values and configuration. Directives are created by passing a function to lit-html's `directive()` function:

```javascript
html`<div>${directive((part) => { part.setValue('Hello')})}</div>`
```

The `part` argument is a `Part` object with an API for directly managing the dynamic DOM associated with expressions. See the `Part` API in api.md.

Here's an example of a directive that takes a function, and evaluates it in a try/catch to implement exception safe expressions:

```javascript
const safe = (f) => directive((part) => {
  try {
    return f();
  } catch (e) {
    console.error(e);
  }
});
```

Now `safe()` can be used to wrap a function:

```javascript
let data;
const render = () => html`foo = ${safe(_=>data.foo)}`;
```

This example increments a counter on every render:

```javascript
const render = () => html`
  <div>
    ${directive((part) => part.setValue((part.previousValue + 1) || 0))}
  </div>`;
```

lit-html includes a few directives:

#### `repeat(items, keyfn, template)`

A loop that supports efficient re-ordering by using item keys.

Example:

```javascript
const render = () => html`
  <ul>
    ${repeat(items, (i) => i.id, (i, index) => html`
      <li>${index}: ${i.name}</li>`)}
  </ul>
`;
```

#### `until(promise, defaultContent)`

Renders `defaultContent` until `promise` resolves, then it renders the resolved value of `promise`.

Example:

```javascript
const render = () => html`
  <p>
    ${until(
        fetch('content.txt').then((r) => r.text()),
        html`<span>Loading...</span>`)}
  </p>
`;
```

### Promises

Promises are rendered when they resolve, leaving the previous value in place until they do. Races are handled, so that if an unresolved Promise is overwritten, it won't update the template when it finally resolves.

```javascript
const render = () => html`
  The response is ${fetch('sample.txt').then((r) => r.text())}.
`;
```

### Composability

These features compose so you can render iterables of functions that return arrays of nested templates, etc...

### Extensibility

`lit-html` is designed to be extended by more opinionated flavors of template syntaxes. For instance, `lit-html` doesn't support declarative event handlers or property setting out-of-the-box. A layer on top can add that while exposing the same API, by implementing a custom `render()` function.

Some examples of possible extensions:

 * Property setting: Attribute expressions in templates could set properties on node.
 * Event handlers: Specially named attributes can install event handlers.
 * HTML values: `lit-html` creates `Text` nodes by default. Extensions could allow setting `innerHTML`.

## Status

`lit-html` is very new, under initial development, and not production-ready.

 * It uses JavaScript modules, and there's no build set up yet, so out-of-the-box it only runs in Safari 10.1, Chrome 61, and Firefox 54 (behind a flag).
 * It has a growing test suite, but it has only been run manually on Chrome Canary, Safari 10.1 and Firefox 54.
 * Much more test coverage is needed for complex templates, especially template composition and Function and Iterable values.
 * It has not been benchmarked thoroughly yet.
 * The API may change.

Even without a build configuration, `lit-html` minified with `babili` and gzipped measures in at less than 1.7k. We will strive to keep the size extremely small.

## Benefits over HTML templates

`lit-html` has basically all of the benefits of HTML-in-JS systems like JSX, like:

### Lighter weight

There's no need to load an expression parser and evaluator.

### Seamless access to data

Since template literals are evaluated in JavaScript, their expressions have access to every variable in that scope, including globals, module and block scopes, and `this` inside methods.

If the main use of templates is to inject values into HTML, this breaks down a major barrier between templates and values.

### Faster expression evaluation

They're just JavaScript expressions.

### IDE support by default

In a type-checking environment like TypeScript, expressions are checked because they are just regular script. Hover-over docs and code-completion just work as well.

### Case-sensitive parsing

Template literals preserve case, even though the HTML parser doesn't for attribute names. `lit-html` extracts the raw attribute names, which is useful for template syntaxes that use attribute syntax to set properties on elements.

## Benefits over JSX

### Native syntax

No tooling required. Understood by all JS editors and tools.

### No VDOM overhead

`lit-html` only re-renders the dynamic parts of a template, so it doesn't produce a VDOM tree of the entire template contents, it just produces new values for each expression. By completely skipping static template parts, it saves work.

### Scoped

JSX requires that the compiler be configured with the function to compile tags to. You can't mix two different JSX configurations in the same file.

The `html` template tag is just a variable, probably an imported function. You can have any number of similar functions in the same JS scope, or set `html` to different implementations.

### Templates are values

JSX translates to function calls, and can't be manipulated on a per-template basis at runtime. `lit-html` produces a template object at runtime, which can be further processed by libraries like ShadyCSS.

### CSS-compatible syntax

Because template literals use `${}` as the expression delimiter, CSS's use of `{}` isn't interpreted as an expression. You can include style tags in your templates as you would expect:

```javascript
html`
  <style>
    :host {
      background: burlywood;
    }
  </style>
`
```

## Future Work

### Async Iterables Support

Async Iterables should be supported natively.

### Higher-Order Templates examples

#### `when(cond, then, else)`

An if-directive that retains the `then` and `else` _instances_ for fast switching between the two states, like `<dom-if>`.

Example:

```javascript
const render = () => html`
  ${when(state === 'loading',
    html`<div>Loading...</div>`,
    html`<p>${message}</p>`)}
`;
```

#### `guard(guardExpr, template)`

Only re-renders an instance if the guard expression has changed since the last render.

Since all expressions in a template literal are evaluated when the literal is evaluated, you may want to only evaluate some expensive expressions when certain other values (probably it's dependencies change). `Guard` would memoize the function and only call it if the guard expression changed.

Example:

```javascript
const render = () => html`
  <div>Current User: ${guard(user, () => user.getProfile())}</div>
`;
```
