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

@customElement('my-app')
export class MyApp extends LitElement {
  // Provide the Redux store in a context to any children of this component.
  @provide({
    context: storeContext,
  })
  _store = store;

  render() {
    return html`
      <div>
        <img alt="Lit Logo" src="/assets/lit.svg" />
        <img alt="Redux Logo" src="/assets/redux.svg" />
      </div>
      <my-counter></my-counter>
    `;
  }

  static styles = css`
    div {
      display: flex;
      justify-content: center;
      gap: 2rem;
      padding: 2rem;
    }

    img {
      max-height: 150px;
      max-width: 150px;
    }
  `;
}
