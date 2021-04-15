# ReactiveElement 1.0 Pre-release

[![Build Status](https://github.com/polymer/lit-html/workflows/Tests/badge.svg)](https://github.com/Polymer/lit-html/actions?query=workflow%3ATests)
[![Published on npm](https://img.shields.io/npm/v/lit-element/next-major)](https://www.npmjs.com/package/lit-html)
[![Join our Slack](https://img.shields.io/badge/slack-join%20chat-4a154b.svg)](https://www.polymer-project.org/slack-invite)
[![Mentioned in Awesome Lit](https://awesome.re/mentioned-badge.svg)](https://github.com/web-padawan/awesome-lit)

## 🚨 About this pre-release

This is a major version pre-release of ReactiveElement 1.0. This package
has been migrated out of LitElement. See issue
[#1077](https://github.com/Polymer/lit-element/issues/1077) for more info.

This pre-release is not yet feature complete or API stable.

<hr>

# ReactiveElement

A simple low level base class for creating fast, lightweight web components.

## Documentation

Full documentation is available at [lit-element.polymer-project.org](https://lit-element.polymer-project.org).

## Overview

`ReactiveElement` is a base class for writing web components that react to changes in properties and attributes. `ReactiveElement` adds reactive properties and a batching, asynchronous update lifecycle to the standard web component APIs. Subclasses can respond to changes and update the DOM to reflect the element state.

`ReactiveElement` doesn't include a DOM template system, but can easily be extended to add one by overriding the `update()` method to call the template library. `LitElement` is such an extension that adds `lit-html` templating.

## Example

```ts
import {
  ReactiveElement,
  html,
  css,
  customElement,
  property,
  PropertyValues,
} from '@lit/reactive-element';

// This decorator defines the element.
@customElement('my-element')
export class MyElement extends ReactiveElement {
  // This decorator creates a property accessor that triggers rendering and
  // an observed attribute.
  @property()
  mood = 'great';

  static styles = css`
    span {
      color: green;
    }
  `;

  contentEl?: HTMLSpanElement;

  // One time setup of shadowRoot content.
  createRenderRoot() {
    const shadowRoot = super.createRenderRoot();
    shadowRoot.innerHTML = `Web Components are <span></span>!`;
    this.contentEl = shadowRoot.firstElementChild;
    return shadowRoot;
  }

  // Use a DOM rendering library of your choice or manually update the DOM.
  update(changedProperties: PropertyValues) {
    super.update(changedProperties);
    this.contentEl.textContent = this.mood;
  }
}
```

```html
<my-element mood="awesome"></my-element>
```

Note, this example uses decorators to create properties. Decorators are a proposed
standard currently available in [TypeScript](https://www.typescriptlang.org/) or [Babel](https://babeljs.io/docs/en/babel-plugin-proposal-decorators). ReactiveElement also supports a [vanilla JavaScript method](https://lit-element.polymer-project.org/guide/properties#declare) of declaring reactive properties.

## Installation

From inside your project folder, run:

```bash
$ npm install @lit/reactive-element
```

To install the web components polyfills needed for older browsers:

```bash
$ npm i -D @webcomponents/webcomponentsjs
```

## Development mode

`@lit/reactive-element` includes a development mode which adds additional checks that are
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

## Supported Browsers

The last 2 versions of all modern browsers are supported, including
Chrome, Safari, Opera, Firefox, Edge. In addition, Internet Explorer 11 is also supported.

Edge and Internet Explorer 11 require the web components polyfills and the
`polyfill-support` module included in this package.

```html
<script src="node_modules/@webcomponents/webcomponentsjs/webcomponents-loader.js"></script>
<script src="node_modules/@lit/reactive-element/polyfill-support.js"></script>
<!-- load application code -->
```

## Contributing

Please see [CONTRIBUTING.md](./CONTRIBUTING.md).
