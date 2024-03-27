/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {html, css, LitElement} from 'lit';
import {customElement} from 'lit/decorators.js';
import {provide, storeContext} from '@lit-labs/redux';
import {store} from './store.js';
import './my-counter.js';
import './count-incrementor.js';
import './count-display.js';

@customElement('my-app')
export class MyApp extends LitElement {
  // Provide the Redux store in a context to any children of this component.
  @provide({
    context: storeContext,
  })
  _store = store;

  render() {
    return html`
      <main>
        <div>
          <img alt="Lit Logo" src="/assets/lit.svg" />
          <img alt="Redux Logo" src="/assets/redux.svg" />
        </div>
        <my-counter></my-counter>
        <count-incrementor></count-incrementor>
        <count-display></count-display>
      </main>
    `;
  }

  static styles = css`
    :host {
      font-size: 2rem;
    }

    main {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 2rem;
    }

    img {
      height: 150px;
      width: 150px;
    }
  `;
}
