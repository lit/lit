# Lit

![Lit Logo](./logo.png)

## Simple. Fast. Web Components.

Lit is a simple library for building fast, lightweight web components.

At Lit's core is a boilerplate-killing component base class that provides reactive state, scoped styles, and a declarative template system that's tiny, fast and expressive.

## Documentation

See the full documentation for Lit at [lit.dev](https://lit.dev)

## About this release

This release candidate of lit-html 2.0 is intended to be feature complete and API stable. Please note the breaking changes from lit-html 1.0 in the [lit.dev upgrade guide](https://lit-dev-5ftespv5na-uc.a.run.app/docs/releases/upgrade/).

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

// @customElement() registers the element
@customElement('my-element')
export class MyElement extends LitElement {
  // Styles are applied to the shadow root and scoped to this element
  static styles = css`
    span {
      color: green;
    }
  `;

  // @property() creates a reactive property that triggers rendering
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

Please see [CONTRIBUTING.md](./CONTRIBUTING.md).
