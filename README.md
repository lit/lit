> ## 🛠 Status: In Development
> lit-html is currently in development. It's on the fast track to a 1.0 release, so we encourage you to use it and give us your feedback, but there are things that haven't been finalized yet and you can expect some changes.

# lit-html
Efficient, Expressive, Extensible HTML templates in JavaScript

[![Build Status](https://travis-ci.org/Polymer/lit-html.svg?branch=master)](https://travis-ci.org/Polymer/lit-html)
[![Published on npm](https://img.shields.io/npm/v/lit-html.svg)](https://www.npmjs.com/package/lit-html)
[![Mentioned in Awesome lit-html](https://awesome.re/mentioned-badge.svg)](https://github.com/web-padawan/awesome-lit-html)

## Documentation

Full documentation is available at [lit-html.polymer-project.org](https://lit-html.polymer-project.org).

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

 * `html`: A JavaScript [template tag](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals#Tagged_template_literals) used to produce a `TemplateResult`, which is a container for a template, and the values that should populate the template.
 * `render()`: A function that renders a `TemplateResult` to a DOM container, such as an element or shadow root.

## Installation

```bash
$ npm install lit-html
```

## Status

`lit-html` is under active development and has not yet had a 1.0 release. The
internal API may still change somewhat. The `html` and `render` API is stable.

## Documentation site

You can find the source for the lit-html documentation site in the `docs` folder. Guides are written in Markdown, and the site is built using the Jekyll static site generator. 
 
This section describes how to build the documentation site.

### Prerequisites

To build the documentation site, you need Jekyll. If you already have Ruby and the gem pacakge manager, run the following command to install Jekyll:

`gem install bundler jekyll`

For more information, see [the Jekyll website](https://jekyllrb.com/).

Previewing the docs requires the [App Engine Standard Environment for Python 2.7](https://cloud.google.com/appengine/docs/standard/python/quickstart). 

### Building and previewing

To build the API docs:

`npm run gen-docs`

To build the documentation site and preview it from a local server:

```
cd docs
npm run build
npm run serve
```

Point a browser at [localhost:8080](localhost:8080) to preview the site.

## Contributing

Please see [CONTRIBUTING.md](./CONTRIBUTING.md).
