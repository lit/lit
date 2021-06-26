# lit-html 2.0 Release Candidate

Efficient, Expressive, Extensible HTML templates in JavaScript

[![Build Status](https://github.com/lit/lit/workflows/Tests/badge.svg)](https://github.com/lit/lit/actions?query=workflow%3ATests)
[![Published on npm](https://img.shields.io/npm/v/lit-html/next)](https://www.npmjs.com/package/lit-html)
[![Join our Slack](https://img.shields.io/badge/slack-join%20chat-4a154b.svg)](https://www.polymer-project.org/slack-invite)
[![Mentioned in Awesome Lit](https://awesome.re/mentioned-badge.svg)](https://github.com/web-padawan/awesome-lit)

lit-html is the template system that powers the [Lit](https://lit.dev) library for building fast web components.

## About this release

This release candidate of lit-html 2.0 is intended to be feature complete and API stable. Please note the minor breaking changes from lit-html 1.0 in the [lit.dev upgrade guide](https://lit.dev/docs/releases/upgrade/).

## Documentation

Full documentation is available at [lit.dev](https://lit.dev).

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

Or use from `lit`:

```bash
$ npm install lit
```

## Contributing

Please see [CONTRIBUTING.md](./CONTRIBUTING.md).
