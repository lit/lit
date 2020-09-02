# LitElement
A simple base class for creating fast, lightweight web components with [lit-html](https://lit-html.polymer-project.org/).

[![Build Status](https://travis-ci.org/Polymer/lit-element.svg?branch=master)](https://travis-ci.org/Polymer/lit-element)
[![Published on npm](https://img.shields.io/npm/v/lit-element.svg)](https://www.npmjs.com/package/lit-element)
[![Join our Slack](https://img.shields.io/badge/slack-join%20chat-4a154b.svg)](https://www.polymer-project.org/slack-invite)
[![Published on webcomponents.org](https://img.shields.io/badge/webcomponents.org-published-blue.svg)](https://www.webcomponents.org/element/lit-element)
[![Mentioned in Awesome lit-html](https://awesome.re/mentioned-badge.svg)](https://github.com/web-padawan/awesome-lit-html)

## Documentation

Full documentation is available at [lit-element.polymer-project.org](https://lit-element.polymer-project.org).

## Overview

LitElement uses [lit-html](https://lit-html.polymer-project.org/) to render into the
element's [Shadow DOM](https://developer.mozilla.org/en-US/docs/Web/Web_Components/Using_shadow_DOM)
and adds API to help manage element properties and attributes. LitElement reacts to changes in properties
and renders declaratively using `lit-html`. See the [lit-html guide](https://lit-html.polymer-project.org/guide)
for additional information on how to create templates for lit-element.

```ts
    import {LitElement, html, css, customElement, property} from 'lit-element';

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
        }`;

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

  * Runs in all [supported](#supported-browsers) browsers: [Glitch](https://glitch.com/edit/#!/hello-lit-element?path=index.html)

  * Runs in browsers with [JavaScript Modules](https://caniuse.com/#search=modules): [Stackblitz](https://stackblitz.com/edit/lit-element-demo?file=src%2Fmy-element.js), [JSFiddle](https://jsfiddle.net/sorvell1/801f9cdu/), [JSBin](http://jsbin.com/vecuyan/edit?html,output),
[CodePen](https://codepen.io/sorvell/pen/RYQyoe?editors=1000).

  * You can also copy [this HTML file](https://gist.githubusercontent.com/sorvell/48f4b7be35c8748e8f6db5c66d36ee29/raw/67346e4e8bc4c81d5a7968d18f0a6a8bc00d792e/index.html) into a local file and run it in any browser that supports [JavaScript Modules]((https://caniuse.com/#search=modules)).

## Installation

From inside your project folder, run:

```bash
$ npm install lit-element
```

To install the web components polyfills needed for older browsers:

```bash
$ npm i -D @webcomponents/webcomponentsjs
```

## Supported Browsers

The last 2 versions of all modern browsers are supported, including
Chrome, Safari, Opera, Firefox, Edge. In addition, Internet Explorer 11 is also supported.

Edge and Internet Explorer 11 require the web components polyfills.

## Contributing

Please see [CONTRIBUTING.md](./CONTRIBUTING.md).
