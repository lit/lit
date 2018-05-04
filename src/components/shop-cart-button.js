/**
 * @license
 * Copyright (c) 2018 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
 */

import { LitElement, html } from '@polymer/lit-element';

import { store } from '../store.js';
import { connect } from 'pwa-helpers/connect-mixin.js';
import { numItemsSelector } from '../reducers/cart.js';

class ShopCartButton extends connect(store)(LitElement) {
  _render({ _numItems }) {
    return html`
    <style>

      :host {
        display: block;
        position: relative;
        width: 40px;
      }

      paper-icon-button {
        color: var(--app-primary-color);
      }

      .cart-badge {
        position: absolute;
        top: -2px;
        right: 0;
        width: 20px;
        height: 20px;
        background-color: var(--app-accent-color);
        border-radius: 50%;
        color: white;
        font-size: 12px;
        font-weight: 500;
        pointer-events: none;
        display: flex;
        align-items: center;
        justify-content: center;
      }

    </style>

    <a href="/cart" tabindex="-1">
      <paper-icon-button icon="shopping-cart" aria-label$="${`Shopping cart: ${_numItems} item${_numItems > 1 ? 's' : ''}`}"></paper-icon-button>
    </a>
    ${ _numItems ? html`<div class="cart-badge" aria-hidden="true">${_numItems}</div>`: null }
`;
  }

  static get properties() { return {
    _numItems: Number
  }}

  _stateChanged(state) {
    this._numItems = numItemsSelector(state);
  }
}

customElements.define('shop-cart-button', ShopCartButton);
