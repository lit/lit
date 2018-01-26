import { LitElement, html } from '../../node_modules/@polymer/lit-element/lit-element.js';

class ShopListItem extends LitElement {
  render({ item }) {
    return html`
    <style>

      :host {
        display: flex;
        flex-direction: column;
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

    <shop-image src="${item.image}" alt="${item.title}"></shop-image>
    <div class="title">${item.title}</div>
    <span class="price">${this._formatPrice(item.price)}</span>
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
