# lit-html 2.0 Pre-release

Efficient, Expressive, Extensible HTML templates in JavaScript

[![Build Status](https://github.com/polymer/lit-html/workflows/Tests/badge.svg)](https://github.com/Polymer/lit-html/actions?query=workflow%3ATests)
[![Published on npm](https://img.shields.io/npm/v/lit-html/next-major)](https://www.npmjs.com/package/lit-html)
[![Join our Slack](https://img.shields.io/badge/slack-join%20chat-4a154b.svg)](https://www.polymer-project.org/slack-invite)
[![Mentioned in Awesome Lit](https://awesome.re/mentioned-badge.svg)](https://github.com/web-padawan/awesome-lit)

## 🚨 About this pre-release

This is a major version pre-release of lit-html 2.0. See issue
[#1182](https://github.com/Polymer/lit-html/issues/1182) for the full list of changes
planned/considered for this release.

This pre-release is not yet feature complete or API stable. Please note the
breaking changes, known issues, and limitations below, and use at your risk
until the stable release is available. Issues are welcome
for unexpected changes not noted below or in the changelog.

## 🚨 Breaking changes

While `lit-html` 2.0 is intended to be a backward-compatible change for the
majority of 1.x users, please be aware of the following notable breaking
changes:

- New `directive` and `Part` API (see below for migration info)
- `render()` no longer clears its container on first render
- Custom `templateFactory`, `TemplateProcessor`, and custom tag functions are no
  longer supported
- The `polyfill-support.js` file must be loaded when using the `webcomponents`
  polyfills

See the full [changelog](CHANGELOG.md) for more details on
these and other minor breaking changes.

## 🚨 Migrating directives

While the API for _using_ directives should be 100% backward-compatible with
1.x, there is a breaking change to how custom directives are _authored_. The API
change improves ergonomics around making stateful directives while providing a
clear pattern for SSR-compatible directives: only `render` will be called on the
server, while `update` will not be.

<details>
<summary>Expand here for details on migrating directives.</summary>

### Overview of directive API changes

|                                              | 1.x API                                                                                           | 2.0 API                                                                 |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| Code idiom for directive                     | function that takes directive arguments, and returns function that takes `part` and returns value | class with `update` & `render` methods which accept directive arguments |
| Where to do declarative rendering            | pass value to `part.setValue()`                                                                   | return value from `render()` method                                     |
| Where to do imperative DOM/part manipulation | directive function                                                                                | `update()` method                                                       |
| Where state is stored between renders        | `WeakMap` keyed on `part`                                                                         | class instance fields                                                   |
| How part validation is done                  | `instanceof` check on `part` in every render                                                      | `part.type` check in constructor                                        |

### Example directive migration

Below is an example of a lit-html 1.x directive, and how to migrate it to the
new API:

1.x Directive API:

```js
import {directive, NodePart, html} from 'lit-html';

// State stored in WeakMap
const previousState = new WeakMap();

// Functional-based directive API
export const renderCounter = directive((initialValue) => (part) => {
  // When necessary, validate part type each render using `instanceof`
  if (!(part instanceof NodePart)) {
    throw new Error('renderCounter only supports NodePart');
  }
  // Retrieve value from previous state
  let value = previousState.get(part);
  // Update state
  if (previous === undefined) {
    value = initialValue;
  } else {
    value++;
  }
  // Store state
  previousState.set(part, value);
  // Update part with new rendering
  part.setValue(html`<p>${value}</p>`);
});
```

2.0 Directive API:

```js
import {html} from 'lit-html';
import {directive, Directive, PartType} from 'lit-html/directive.js';

// Class-based directive API
export const renderCounter = directive(
  class extends Directive {
    // State stored in class field
    value = undefined;
    constructor(partInfo: PartInfo, index?: number) {
      super(partInfo, index);
      // When necessary, validate part in constructor using `part.type`
      if (partInfo.type !== PartType.CHILD) {
        throw new Error('renderCounter only supports child expressions');
      }
    }
    // Any imperative updates to DOM/parts would go here
    update(part, [initialValue]) {
      // ...
    }
    // Do SSR-compatible rendering (arguments are passed from call site)
    render(initialValue) {
      // Previous state available on class field
      if (this.value === undefined) {
        this.value = initialValue;
      } else {
        this.value++;
      }
      return html`<p>${this.value}</p>`;
    }
  }
);
```

</details>

<hr>

# lit-html

## Overview

`lit-html` lets you write [HTML templates](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/template) in JavaScript with [template literals](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals).

lit-html templates are plain JavaScript and combine the familiarity of writing HTML with the power of JavaScript. lit-html takes care of efficiently rendering templates to DOM, including efficiently updating the DOM with new values.

```javascript
import {html, render} from 'lit-html';

// This is a lit-html template function. It returns a lit-html template.
const helloTemplate = (name) => html`<div>Hello ${name}!</div>`;

// This renders <div>Hello Steve!</div> to the document body
render(helloTemplate('Steve'), document.body);

// This updates to <div>Hello Kevin!</div>, but only updates the ${name} part
render(helloTemplate('Kevin'), document.body);
```

`lit-html` provides two main exports:

- `html`: A JavaScript [template tag](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals#Tagged_template_literals) used to produce a `TemplateResult`, which is a container for a template, and the values that should populate the template.
- `render()`: A function that renders a `TemplateResult` to a DOM container, such as an element or shadow root.

## Installation

```bash
$ npm install lit-html
```

## Development mode

lit-html includes a development mode which adds additional checks that are
reported in the console.

To enable development mode, add the `development` exports condition to your node
resolve configuration.

#### @web/dev-server

```js
{
  nodeResolve: {
    exportConditions: ['development'],
  }
}
```

#### Rollup

```js
{
  plugins: [
    nodeResolve({
      exportConditions: ['development'],
    }),
  ],
}
```

#### Webpack

> NOTE: Requires [Webpack v5](https://webpack.js.org/migrate/5/)

```js
{
  resolve: {
    conditionNames: ['development'],
  }
}
```

## Contributing

Please see [CONTRIBUTING.md](../../CONTRIBUTING.md).
