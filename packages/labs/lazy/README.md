# @lit-labs/lazy

Tools for making Lit scale.

## Overview

## Installation

From inside your project folder, run:

```bash
$ npm install @lit-labs/lazy
```

## Usage

Here's an example:

```ts
import {LazyElement, action} from '@lit-labs/lazy';
// ...

class MyElement extends LazyElement {

  @state()
  private _userId: number;

  static load () => import('./my-controller.js');

  render() {
    return html`
      <button @click=${action((e) => this.controller.click(e))}>Click</button>
    `;
  }
}
```

## Contributing

Please see [CONTRIBUTING.md](./CONTRIBUTING.md).
