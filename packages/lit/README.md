<div align="center">
<picture>
  <source media="(prefers-color-scheme: dark)" srcset="./logo-dark.svg" alt="Lit" width="300" height="141">
  </source>
  <source media="(prefers-color-scheme: light)" srcset="./logo.svg" alt="Lit" width="300" height="141">
  </source>
  <img src="./logo.svg" alt="Lit" width="300" height="141">
</picture>

### Simple. Fast. Web Components.

[![Build Status](https://github.com/lit/lit/actions/workflows/tests.yml/badge.svg)](https://github.com/lit/lit/actions/workflows/tests.yml)
[![Published on npm](https://img.shields.io/npm/v/lit.svg?logo=npm)](https://www.npmjs.com/package/lit)
[![Join our Discord](https://img.shields.io/badge/discord-join%20chat-5865F2.svg?logo=discord&logoColor=fff)](https://lit.dev/discord/)
[![Mentioned in Awesome Lit](https://awesome.re/mentioned-badge.svg)](https://github.com/web-padawan/awesome-lit)

</div>

Lit is a simple library for building fast, lightweight web components.

At Lit's core is a boilerplate-killing component base class that provides reactive state, scoped styles, and a declarative template system that's tiny, fast and expressive.

## About this release

Lit 3.0 has very few breaking changes from Lit 2.0:

- Drops support for IE11
- Published as ES2021
- Removes a couple of deprecated Lit 1.x APIs

Lit 3.0 should require no changes to upgrade from Lit 2.0 for the vast majority of users. Most apps and libraries will be able to extend their npm version ranges to include both 2.x and 3.x, like `"^2.7.0 || ^3.0.0"`.

Lit 2.x and 3.0 are _interoperable_: templates, base classes, directives, decorators, etc., from one version of Lit will work with those from another.

Please file any issues you find on our [issue tracker](https://github.com/lit/lit/issues).

## Documentation

See the full documentation for Lit at [lit.dev](https://lit.dev)

## Overview

Lit provides developers with just the right tools to build fast web components:

- A fast declarative HTML template system
- Reactive property declarations
- A customizable reactive update lifecycle
- Easy to use scoped CSS styling

Lit builds on top of standard web components, and makes them easier to write:

```ts
import {LitElement, html, css} from 'lit';
import {customElement, property} from 'lit/decorators.js';

// Registers the element
@customElement('my-element')
export class MyElement extends LitElement {
  // Styles are applied to the shadow root and scoped to this element
  static styles = css`
    span {
      color: green;
    }
  `;

  // Creates a reactive property that triggers rendering
  @property()
  mood = 'great';

  // Render the component's DOM by returning a Lit template
  render() {
    return html`Web Components are <span>${this.mood}</span>!`;
  }
}
```

Once you've defined your component, you can use it anywhere you use HTML:

```html
<my-element mood="awesome"></my-element>
```

## Contributing

Please see [CONTRIBUTING.md](../../CONTRIBUTING.md).
