# @lit-labs/observers

Mutation, resize, and intersection observers for Lit

## Overview

This package provides reactive controller wrappers for the DOM observer APIs: MutationObserver, ResizeObserver, and IntersectionObserver.

These contollers make it easy to observe elements within a Lit template and re-render when the observers are triggered.

## Installation

From inside your project folder, run:

```bash
$ npm install @lit-labs/observers
```

## Usage

ResizeController example:

```ts
import {LitElement, html} from 'lit';
import {customElement} from 'lit/decorators.js';
import {ResizeController} from '../resize.js';

@customElement('resize-controller-demo')
export class ResizeControllerDemoElement extends LitElement {
  _resize = new ResizeController(this);

  render() {
    return html`
      <textarea ${this._resize.observe()}>Resize Me</textarea>
      <pre>
        Width: ${this._resize.contentRect?.width}
        Height: ${this._resize.contentRect?.height}
      </pre
      >
    `;
  }
}
```

## Contributing

Please see [CONTRIBUTING.md](../../../CONTRIBUTING.md).
