import { Element } from '../node_modules/@polymer/polymer/polymer-element.js';
import '../node_modules/@polymer/iron-flex-layout/iron-flex-layout.js';

import { store } from './redux/index.js';
import { numItemsSelector } from './redux/reducers/cart.js';

class ShopCartButton extends Element {
  static get template() {
    return `
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
        @apply --layout-vertical;
        @apply --layout-center-center;
      }

    </style>

    <a href="/cart" tabindex="-1">
      <paper-icon-button icon="shopping-cart" aria-label\$="Shopping cart: [[_computePluralizedQuantity(numItems)]]"></paper-icon-button>
    </a>
    <div class="cart-badge" aria-hidden="true" hidden\$="[[!numItems]]">[[numItems]]</div>
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
    this.setProperties({
      numItems: numItemsSelector(state)
    });
  }

  _computePluralizedQuantity(quantity) {
    return quantity + ' ' + (quantity === 1 ? 'item' : 'items');
  }
}

customElements.define(ShopCartButton.is, ShopCartButton);
