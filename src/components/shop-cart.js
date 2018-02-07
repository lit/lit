/**
 * @license
 * Copyright (c) 2018 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
 */

import { LitElement, html } from '../../node_modules/@polymer/lit-element/lit-element.js';
import { repeat } from '../../node_modules/lit-html/lib/repeat.js';
import { shopButtonStyle } from './shop-button-style.js';
import { shopCommonStyle } from './shop-common-style.js';
import { shopFormStyle } from './shop-form-style.js';

import { store } from '../store.js';
import { connect } from '../../node_modules/redux-helpers/connect-mixin.js';
import { totalSelector } from '../reducers/cart.js';

class ShopCart extends connect(store)(LitElement) {
  render({ cart, total }) {
    return html`
    <style>
      ${shopButtonStyle}
      ${shopCommonStyle}
      ${shopFormStyle}

      .list {
        margin: 40px 0;
      }

      .checkout-box {
        font-weight: bold;
        text-align: right;
        margin-right: 10px;
      }

      .subtotal {
        margin: 0 64px 0 24px;
      }

      @media (max-width: 767px) {

        .subtotal {
          margin: 0 0 0 24px;
        }

      }

    </style>

    <div class="main-frame">
      <div class="subsection">
        ${ cart.length > 0 ? html`
            <header>
              <h1>Your Cart</h1>
              <span>${`(${cart.length} item${cart.length > 1 ? 's' : ''})`}</span>
            </header>
            <div class="list">
              ${repeat(cart, entry => html`
                <shop-cart-item entry="${entry}"></shop-cart-item>
              `)}
            </div>
            <div class="checkout-box">
              Total: <span class="subtotal">$${total.toFixed(2)}</span>
              <shop-button responsive>
                <a href="/checkout">Checkout</a>
              </shop-button>
            </div>` : html`
            <p class="empty-cart">Your <iron-icon icon="shopping-cart"></iron-icon> is empty.</p>`
        }
      </div>
    </div>
    `;
  }
  static get is() { return 'shop-cart'; }

  static get properties() { return {

    total: Number,

    cart: Array

  }}

  stateChanged() {
    const state = store.getState();
    this.cart = state.cart ? Object.values(state.cart): [];
    this.total = totalSelector(state);
  }

}

customElements.define(ShopCart.is, ShopCart);
