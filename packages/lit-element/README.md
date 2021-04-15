# LitElement 3.0 Pre-release

[![Build Status](https://github.com/polymer/lit-html/workflows/Tests/badge.svg)](https://github.com/Polymer/lit-html/actions?query=workflow%3ATests)
[![Published on npm](https://img.shields.io/npm/v/lit-element/next-major)](https://www.npmjs.com/package/lit-html)
[![Join our Slack](https://img.shields.io/badge/slack-join%20chat-4a154b.svg)](https://www.polymer-project.org/slack-invite)
[![Mentioned in Awesome Lit](https://awesome.re/mentioned-badge.svg)](https://github.com/web-padawan/awesome-lit)

## 🚨 About this pre-release

This is a major version pre-release of LitElement 3.0. See issue
[#1077](https://github.com/Polymer/lit-element/issues/1077) for the full list of
changes planned/considered for this release.

This pre-release is not yet feature complete or API stable. Please note the
breaking changes, known issues, and limitations below, and use at your risk
until the stable release is available. Issues are welcome
for unexpected changes not noted below or in the changelog.

## 🚨 Breaking changes

While `LitElement` 3.0 is intended to be a mostly backward-compatible change for the
majority of 2.x users, please be aware of the following notable breaking
changes:

- This `LitElement` pre-release uses the `lit-html` pre-release as well.
  Please see the `lit-html` pre-release [README](../lit-html/README.md) and
  [changelog](../lit-html/CHANGELOG.md#200-pre1---2020-09-21) for information on
  any breaking changes to `lit-html` features in your components.
- Decorators are no longer exported from the top-level `lit-element` module.
  Instead, import any decorators you use from `lit-element/decorators/*`.
- `requestUpdate()` no longer returns a Promise. Instead await the
  `updateComplete` Promise.

See the full [changelog](CHANGELOG.md#300-pre1---2020-09-21) for more details on
these and other minor breaking changes.

<hr>

# LitElement

A simple base class for creating fast, lightweight web components with [lit-html](https://lit-html.polymer-project.org/).

## Documentation

Full documentation is available at [lit-element.polymer-project.org](https://lit-element.polymer-project.org).

## Overview

Note, the `LitElement` package has been replaced by the `lit` package. `LitElement` is provided only for backwards compatibility; when possible, users should upgrade to the `lit` package.

LitElement uses [lit-html](https://lit-html.polymer-project.org/) to render into the
element's [Shadow DOM](https://developer.mozilla.org/en-US/docs/Web/Web_Components/Using_shadow_DOM)
and adds API to help manage element properties and attributes. LitElement reacts to changes in properties
and renders declaratively using `lit-html`. See the [lit-html guide](https://lit-html.polymer-project.org/guide)
for additional information on how to create templates for lit-element.

```ts
import {LitElement, html, css} from 'lit-element';
import {customElement, property} from 'lit-element/decorators.js';

// This decorator defines the element.
@customElement('my-element')
export class MyElement extends LitElement {
  // This decorator creates a property accessor that triggers rendering and
  // an observed attribute.
  @property()
  mood = 'great';

  static styles = css`
    span {
      color: green;
    }
  `;

  // Render element DOM by returning a `lit-html` template.
  render() {
    return html`Web Components are <span>${this.mood}</span>!`;
  }
}
```

```html
<my-element mood="awesome"></my-element>
```

Note, this example uses decorators to create properties. Decorators are a proposed
standard currently available in [TypeScript](https://www.typescriptlang.org/) or [Babel](https://babeljs.io/docs/en/babel-plugin-proposal-decorators). LitElement also supports a [vanilla JavaScript method](https://lit-element.polymer-project.org/guide/properties#declare) of declaring reactive properties.

## Examples

- Runs in all [supported](#supported-browsers) browsers: [Glitch](https://glitch.com/edit/#!/hello-lit-element?path=index.html)

- Runs in browsers with [JavaScript Modules](https://caniuse.com/#search=modules): [Stackblitz](https://stackblitz.com/edit/lit-element-demo?file=src%2Fmy-element.js), [JSFiddle](https://jsfiddle.net/sorvell1/801f9cdu/), [JSBin](http://jsbin.com/vecuyan/edit?html,output),
  [CodePen](https://codepen.io/sorvell/pen/RYQyoe?editors=1000).

- You can also copy [this HTML file](https://gist.githubusercontent.com/sorvell/48f4b7be35c8748e8f6db5c66d36ee29/raw/67346e4e8bc4c81d5a7968d18f0a6a8bc00d792e/index.html) into a local file and run it in any browser that supports [JavaScript Modules](<(https://caniuse.com/#search=modules)>).

## Installation

From inside your project folder, run:

```bash
$ npm install lit-element
```

To install the web components polyfills needed for older browsers:

```bash
$ npm i -D @webcomponents/webcomponentsjs
```

## Development mode

lit-element includes a development mode which adds additional checks that are
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

Edge and Internet Explorer 11 require the
[web components polyfills](https://www.npmjs.com/package/@webcomponents/webcomponentsjs)
and the `polyfill-support` module included in this package.

```html
<script src="node_modules/@webcomponents/webcomponentsjs/webcomponents-loader.js"></script>
<script src="node_modules/lit-element/polyfill-support.js"></script>
<!-- load application code -->
```

## Contributing

Please see [CONTRIBUTING.md](./CONTRIBUTING.md).
