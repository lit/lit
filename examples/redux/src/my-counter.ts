/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {html, css, LitElement} from 'lit';
import {customElement} from 'lit/decorators.js';
import {AppConnector} from './app-connector.js';
import {increment, decrement} from './counter-slice.js';

@customElement('my-counter')
export class MyCounter extends LitElement {
  // Select the counter value from the Redux store from parent context.
  _connector = new AppConnector(this, {
    selector: (state) => state.counter.value,
  });

  _incrementCount() {
    this._connector.dispatch(increment());
  }

  _decrementCount() {
    this._connector.dispatch(decrement());
  }

  render() {
    return html`
      <div>
        <button @click=${this._incrementCount}>+</button>
        <span>${this._connector.selected}</span>
        <button @click=${this._decrementCount}>−</button>
      </div>
    `;
  }

  static styles = css`
    div {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 1rem;
    }

    button {
      font-size: 1.5rem;
      padding: 10px;
    }
  `;
}
