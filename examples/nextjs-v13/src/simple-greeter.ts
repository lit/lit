/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {LitElement, html, css} from 'lit';
import {customElement, property} from 'lit/decorators.js';
import type React from 'react';
import './count-display';

@customElement('simple-greeter')
export class SimpleGreeter extends LitElement {
  static styles = css`
    div {
      border: 1px solid black;
      padding: 1rem;
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    @media (prefers-color-scheme: dark) {
      div {
        border-color: white;
      }
    }

    span {
      color: rebeccapurple;
    }

    p {
      font-family: sans-serif;
    }
  `;

  @property()
  name = 'Somebody';

  @property({type: Number})
  count = 0;

  render() {
    return html`
      <div>
        <h1>Hello, <span>${this.name}</span>!</h1>
        <count-display .count=${this.count}></count-display>
        <button @click=${() => this.count++}>++</button>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'simple-greeter': SimpleGreeter;
  }

  namespace JSX {
    interface IntrinsicElements {
      'simple-greeter':
        | React.DetailedHTMLProps<
            React.HTMLAttributes<SimpleGreeter>,
            SimpleGreeter
          >
        | Partial<SimpleGreeter>;
    }
  }
}
