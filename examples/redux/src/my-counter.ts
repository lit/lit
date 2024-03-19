/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {html, css, LitElement} from 'lit';
import {customElement, state} from 'lit/decorators.js';
import {AppSelector} from './app-selector.js';
import {increment, decrement, incrementByAmount} from './counter-slice.js';

@customElement('my-counter')
export class MyCounter extends LitElement {
  // Select the counter value from the Redux store from parent context.
  _selected = new AppSelector(this, {selector: (state) => state.counter.value});

  @state()
  _incrementAmount = '2';

  _incrementCount() {
    this._selected.dispatch(increment());
  }

  _decrementCount() {
    this._selected.dispatch(decrement());
  }

  _handleInput(e: InputEvent) {
    this._incrementAmount = (e.target as HTMLInputElement).value;
  }

  _incrementCountByAmount() {
    this._selected.dispatch(
      incrementByAmount(Number(this._incrementAmount) || 0)
    );
  }

  render() {
    return html`
      <div class="container">
        <div class="row">
          <button @click=${this._incrementCount}>+</button>
          <span>${this._selected.value}</span>
          <button @click=${this._decrementCount}>−</button>
        </div>
        <div class="row">
          <input @input=${this._handleInput} .value=${this._incrementAmount} />
          <button @click=${this._incrementCountByAmount}>Add Amount</button>
        </div>
      </div>
    `;
  }

  static styles = css`
    :host {
      font-size: 2rem;
    }

    .container {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1rem;
    }

    .row {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 1rem;
    }

    button {
      font-size: 1.5rem;
      padding: 10px;
    }

    input {
      font-size: 1.5rem;
      padding: 10px;
      width: 100px;
      text-align: center;
    }
  `;
}
