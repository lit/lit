# @lit-labs/parts

A set of tools for facilitating theming using
[css shadow parts](https://www.w3.org/TR/css-shadow-parts-1/).

## Overview

CSS inside Shadow DOM is scoped to the shadowRoot and by default styling cannot
leak out or into the DOM in a shadowRoot. While this style encapsulation is
extremely helpful, sometimes it's desirable to expose the styling of elements
inside a shadowRoot to external users.

One way to do this is to use
[CSS custom properties](https://developer.mozilla.org/en-US/docs/Web/CSS/--*),
which inherit down the DOM tree into shadowRoots. This works well for exposing
specific css properties to customization.

However, sometimes it's desirable to expose the styling of an entire element
to an outside user. The
[CSS shadow parts](https://www.w3.org/TR/css-shadow-parts-1/) platform
feature does just this. By placing a `part=name` attribute on an element in
a shadowRoot, the element is target-able in the css scope containing the host
element using a `::part(name)` selector.

The `part` attribute exposes an element just to 1 outer scope, not to any
containing shadowRoots. To do this, parts can be forwarded using the
`exportparts` attribute.

This package provides a mixin which automates forwarding parts via the
`exportparts` attribute. By using this parts become available for user
customizable theming anywhere the element containing the part is used.
Essentially, this makes `exportparts` not an "opt-in" feature as it normally is.
Instead, elements can "opt-out" of the mixin's behavior if they use a closed
shadowRoot.

In addition, this package provides a mechanism for specifying parts such that
they can be referenced by a javascript reference rather than a string. This is
useful to avoid typos and for type checking.

## Installation

From inside your project folder, run:

```bash
$ npm install @lit-labs/parts
```

## Usage

Here's an example:

```ts
import {LitElement, html, css} from 'lit';
import {PartsMixin, define, part} from '@lit-labs/parts';
// ...

const tag = 'my-element';

/** Provides an object of the form {
 * [name]: PartInfo {
 *   name: "prefix_name",
 *   css: "::part(prefix_name)"
 *   def: "[part=prefix_name]"
 * } }
 */
const parts = define(['header', 'main', 'footer'], tag);

@customElement(tag)
export class MyElement extends PartsMixin(LitElement) {
  // Expose parts to external users.
  static parts = parts;

  // Use the part's `def` property to specify part defaults.
  static styles = css`
    ${parts.header.def} {
      font-size: 2rem;
    }
  `;

  // Use the `part` directive to specify parts in a Lit template.
  render() {
    return html`
      <div ${part(parts.header)}>Header</div>
      <div ${part(parts.main)}>Main</div>
      <div ${part(parts.footer)}>Footer</div>
    `;
  }
}

// Styling in the main document:
import {MyElement} from './my-element.js';
import {createStyle} from '@lit-labs/parts';

document.head.append(createStyle`
  ${MyElement.parts.header} {
    color: orange;
    padding: 10px;
  }
`);
```

## Contributing

Please see [CONTRIBUTING.md](./CONTRIBUTING.md).
