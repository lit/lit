# @lit-labs/after-burner

Tools for making Lit scale.

## Overview

## Installation

From inside your project folder, run:

```bash
$ npm install @lit-labs/after-burner
```

## Usage

Here's an example:

```ts
import {BurnerElement, BurnerController, action} from '@lit-labs/after-burner';
// ...

class MyElement extends BurnerElement {

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
