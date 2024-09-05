# @lit-labs/observers

A set of reactive controllers that facilitate using the platform observer
objects, including:

- MutationObserver
- ResizeObserver
- IntersectionObserver
- PerformanceObserver

## Overview

The modern web platform provides a number of observer helpers that can be used
to detect changes to which web applications may want to react. By managing
one of these observers with a reactive controller, changes can be easily
integrated into the Lit reactive update lifecycle. The controller can also help
manage observer cleanup and rendering in response to changes.

## Installation

From inside your project folder, run:

```bash
$ npm install @lit-labs/observers
```

## Usage

Here's an example:

### MutationController

```ts
import {MutationController} from '@lit-labs/observers/mutation_controller.js';
// ...

class MyElement extends LitElement {
  private _observer = new MutationController(this, {
    config: {attributes: true},
  });

  render() {
    return html` ${this._observer.value ? `Attributes set!` : ``} `;
  }
}
```

### ResizeController

```ts
import { ResizeController } from "@lit-labs/observers/resize-controller.js";
// ...

class MyElement extends LitElement {
private _resizeController = new ResizeController<DOMRectReadOnly>(this, {
    // Save into _resizeController.value only the current rect dimentions
    callback: (entries: ResizeObserverEntry[]) => entries[entries.length - 1].contentRect,
  });

render() {
  const width = this._resizeController.value.width;
  const height = this._resizeController.value.height;

  return html`<div class="container">${width}px x${height}px</div>`;
}

  static styles = css`
    .container {
      display: block;
      width: 100%;
      height: 100%;
    }
  `;
}
```

## Contributing

Please see [CONTRIBUTING.md](../../../CONTRIBUTING.md).
