# ReactiveElement 1.0 Pre-release

[![Build Status](https://github.com/polymer/lit-html/workflows/Tests/badge.svg?branch=lit-next)](https://github.com/Polymer/lit-html/actions?query=workflow%3ATests)
[![Published on npm](https://img.shields.io/npm/v/lit-element/next-major)](https://www.npmjs.com/package/lit-html)
[![Join our Slack](https://img.shields.io/badge/slack-join%20chat-4a154b.svg)](https://www.polymer-project.org/slack-invite)
[![Mentioned in Awesome lit-html](https://awesome.re/mentioned-badge.svg)](https://github.com/web-padawan/awesome-lit-html)

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

ReactiveElement is a low level base class for creating custom elements that
render content to shadowRoot via a user implemented method. It adds API to help
manage element properties and attributes. ReactiveElement reacts to changes in
properties and calls the update method which should be implemented to update
the rendered state of the element.

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

## Examples

- Runs in all [supported](#supported-browsers) browsers: [Glitch](https://glitch.com/edit/#!/hello-lit-element?path=index.html)

- Runs in browsers with [JavaScript Modules](https://caniuse.com/#search=modules): [Stackblitz](https://stackblitz.com/edit/lit-element-demo?file=src%2Fmy-element.js), [JSFiddle](https://jsfiddle.net/sorvell1/801f9cdu/), [JSBin](http://jsbin.com/vecuyan/edit?html,output),
  [CodePen](https://codepen.io/sorvell/pen/RYQyoe?editors=1000).

- You can also copy [this HTML file](https://gist.githubusercontent.com/sorvell/48f4b7be35c8748e8f6db5c66d36ee29/raw/67346e4e8bc4c81d5a7968d18f0a6a8bc00d792e/index.html) into a local file and run it in any browser that supports [JavaScript Modules](<(https://caniuse.com/#search=modules)>).

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

@lit/reactive-element includes a development mode which adds additional checks that are
reported in the console.

To enable development mode, add the `development` exports condition to your node
resolve configuration.

#### @web/dev-server

> NOTE: Requires [rollup#540](https://github.com/rollup/plugins/pull/540)

```js
{
  nodeResolve: {
    exportConditions: ['development'];
  }
}
```

#### Rollup

> NOTE: Requires [rollup#540](https://github.com/rollup/plugins/pull/540)

```js
{
  plugins: [
    nodeResolve({
      exportConditions: ['development'],
    }),
  ];
}
```

#### Webpack

> NOTE: Requires [Webpack v5](https://webpack.js.org/migrate/5/)

```js
{
  resolve: {
    conditionNames: ['development'];
  }
}
```

## Supported Browsers

The last 2 versions of all modern browsers are supported, including
Chrome, Safari, Opera, Firefox, Edge. In addition, Internet Explorer 11 is also supported.

Edge and Internet Explorer 11 require the web components polyfills.

## Contributing

Please see [CONTRIBUTING.md](./CONTRIBUTING.md).
