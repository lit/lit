import { LitElement, html } from '../../node_modules/@polymer/lit-element/lit-element.js';

import { store } from '../store.js';
import { numItemsSelector } from '../reducers/cart.js';

class ShopCartButton extends LitElement {
  render({ numItems }) {
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
      <paper-icon-button icon="shopping-cart" aria-label$="${`Shopping cart: ${numItems} item${numItems > 1 ? 's' : ''}`}"></paper-icon-button>
    </a>
    ${ numItems ? html`<div class="cart-badge" aria-hidden="true">${numItems}</div>`: null }
`;
  }

  static get is() { return 'shop-cart-button'; }

  static get properties() { return {
    numItems: Number
  }}

  constructor() {
    super();

    store.subscribe(() => this.update());
    this.update();
  }

  update() {
    const state = store.getState();
    this.numItems = numItemsSelector(state);
  }
}

customElements.define(ShopCartButton.is, ShopCartButton);
