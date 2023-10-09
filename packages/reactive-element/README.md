# ReactiveElement 1.0

[![Build Status](https://github.com/lit/lit/workflows/Tests/badge.svg)](https://github.com/lit/lit/actions?query=workflow%3ATests)
[![Published on npm](https://img.shields.io/npm/v/@lit/reactive-element?logo=npm)](https://www.npmjs.com/package/@lit/reactive-element)
[![Join our Discord](https://img.shields.io/badge/discord-join%20chat-5865F2.svg?logo=discord&logoColor=fff)](https://lit.dev/discord/)
[![Mentioned in Awesome Lit](https://awesome.re/mentioned-badge.svg)](https://github.com/web-padawan/awesome-lit)

# ReactiveElement

A simple low level base class for creating fast, lightweight web components.

## About this release

This is a pre-release of Lit 3.0, the next major version of Lit.

Lit 3.0 has very few breaking changes from Lit 2.0:

- Drops support for IE11
- Published as ES2021
- Removes a couple of deprecated Lit 1.x APIs

Lit 3.0 should require no changes to upgrade from Lit 2.0 for the vast majority of users. Once the full release is published, most apps and libraries will be able to extend their npm version ranges to include both 2.x and 3.x, like `"^2.7.0 || ^3.0.0"`.

Lit 2.x and 3.0 are _interoperable_: templates, base classes, directives, decorators, etc., from one version of Lit will work with those from another.

Please file any issues you find on our [issue tracker](https://github.com/lit/lit/issues).

## Documentation

Full documentation is available at [lit.dev](https://lit.dev/docs/api/ReactiveElement/).

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
standard currently available in [TypeScript](https://www.typescriptlang.org/) or [Babel](https://babeljs.io/docs/en/babel-plugin-proposal-decorators). ReactiveElement also supports a [vanilla JavaScript method](https://lit.dev/docs/components/properties/#declaring-properties-in-a-static-properties-field) of declaring reactive properties.

## Installation

```bash
$ npm install @lit/reactive-element
```

Or use from `lit`:

```bash
$ npm install lit
```

## Contributing

Please see [CONTRIBUTING.md](../../CONTRIBUTING.md).
