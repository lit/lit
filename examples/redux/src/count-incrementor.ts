/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {html, css, LitElement} from 'lit';
import {customElement, state} from 'lit/decorators.js';
import {incrementByAmount} from './counter-slice.js';
import {dispatch} from '@lit-labs/redux';
import type {AppDispatch} from './store.js';

@customElement('count-incrementor')
export class CountIncrementor extends LitElement {
  @dispatch()
  _dispatch!: AppDispatch;

  @state()
  _incrementAmount = '2';

  _handleInput(e: InputEvent) {
    this._incrementAmount = (e.target as HTMLInputElement).value;
  }

  _incrementCountByAmount() {
    this._dispatch(incrementByAmount(Number(this._incrementAmount) || 0));
  }

  render() {
    return html`
      <div class="row">
        <input @input=${this._handleInput} .value=${this._incrementAmount} />
        <button @click=${this._incrementCountByAmount}>Add Amount</button>
      </div>
    `;
  }

  static styles = css`
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
