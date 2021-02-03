# @lit-labs/motion

Lit directives for making things move.

## Overview

The `flip` directive can be used to animate DOM elements from one lit render
to the next.

## Installation

From inside your project folder, run:

```bash
$ npm install @lit-labs/motion
```

## Usage

Here's an example:

```ts
import {flip} from '@lit-labs/motion';
// ...

class MyElement extends LitElement {
  static properties = {shifted: {}};
  static styles = css`
    .box {
      position: absolute;
      width: 100px;
      height: 100px;
      background: steelblue;
      top: 100px;
      border-radius: 50%;
    }

    .shifted {
      right: 0;
    }
  `;

  render() {
    return html`
      <button @click=${this._toggle}>Move</button>
      <div class="box ${this.shifted ? 'shifted' : ''}" ${flip(options)}></div>
    `;
  }

  _toggle() {
    this.shifted = !this.shifted;
  }
}
```

## Contributing

Please see [CONTRIBUTING.md](./CONTRIBUTING.md).
