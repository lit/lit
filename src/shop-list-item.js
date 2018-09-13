import { PolymerElement, html } from '@polymer/polymer/polymer-element.js';
import '@polymer/iron-flex-layout/iron-flex-layout.js';

class ShopListItem extends PolymerElement {
  static get template() {
    return html`
    <style>

      :host {
        @apply --layout-vertical;
        @apply --layout-center-justified;
        text-align: center;
        margin: 0 48px;
      }

      shop-image {
        margin: 32px 0 16px;
      }

      shop-image::before {
        content: "";
        display: block;
        padding-top: 100%;
      }

      .title {
        color: var(--app-primary-color);
        font-weight: bold;
      }

      .price {
        color: var(--app-secondary-color);
      }

      @media (max-width: 767px) {
        :host {
          margin: 0 12px;
        }
      }

    </style>

    <shop-image src="[[item.image]]" alt="[[item.title]]"></shop-image>
    <div class="title">[[item.title]]</div>
    <span class="price">[[_formatPrice(item.price)]]</span>
`;
  }

  static get is() { return 'shop-list-item'; }

  static get properties() { return {

    item: Object

  }}

  _formatPrice(price) {
    return price ? '$' + price.toFixed(2) : '';
  }
}

customElements.define(ShopListItem.is, ShopListItem);
