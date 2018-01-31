import { LitElement, html } from '../../node_modules/@polymer/lit-element/lit-element.js';
import { unsafeHTML } from '../../node_modules/lit-html/lib/unsafe-html.js';
import { shopButtonStyle } from './shop-button-style.js';
import { shopCommonStyle } from './shop-common-style.js';
import { shopSelectStyle } from './shop-select-style.js';
import './shop-image.js';

import { store } from '../store.js';
import { connect } from '../../node_modules/redux-helpers/connect-mixin.js';
import { splitPathSelector } from '../reducers/location.js';
import { currentCategorySelector, currentItemSelector } from '../reducers/categories.js';
import { addCartEntry } from '../actions/cart.js';

class ShopDetail extends connect(store)(LitElement) {
  render({ failure, item }) {
    return html`
    <style>
      ${shopButtonStyle}
      ${shopCommonStyle}
      ${shopSelectStyle}

      :host {
        display: block;
      }

      #content {
        display: flex;
        flex-direction: row;
        justify-content: center;
      }

      shop-image {
        position: relative;
        margin: 64px 32px;
        width: 50%;
        max-width: 600px;
      }

      shop-image::before {
        content: "";
        display: block;
        padding-top: 100%;
      }

      .detail {
        margin: 64px 32px;
        width: 50%;
        max-width: 400px;
        transition: opacity 0.4s;
        opacity: 0;
      }

      .detail[has-content] {
        opacity: 1;
      }

      h1 {
        font-size: 24px;
        font-weight: 500;
        line-height: 28px;
        margin: 0;
      }

      .price {
        margin: 16px 0 40px;
        font-size: 16px;
        color: var(--app-secondary-color);
      }

      .description {
        margin: 32px 0;
      }

      .description > h2 {
        margin: 16px 0;
        font-size: 13px;
      }

      .description > p {
        margin: 0;
        color: var(--app-secondary-color);
      }

      .pickers {
        display: flex;
        flex-direction: column;
        border-top: 1px solid #ccc;
      }

      shop-select > select {
        font-size: 16px;
        padding: 16px 24px 16px 70px;
      }

      @media (max-width: 767px) {

        #content {
          flex-direction: column;
          align-items: center;
        }

        shop-image {
          margin: 0;
          width: 80%;
        }

        .detail {
          box-sizing: border-box;
          margin: 32px 0;
          padding: 0 24px;
          width: 100%;
          max-width: 600px;
        }

        h1 {
          font-size: 20px;
          line-height: 24px;
        }

        .price {
          font-size: inherit;
          margin: 12px 0 32px;
        }

      }

    </style>

    ${ !failure && item ? html`
      <div id="content">
        <shop-image alt="${item.title}" src="${item.largeImage}"></shop-image>
        <div class="detail" has-content>
          <h1>${item.title}</h1>
          <div class="price">${this._formatPrice(item.price)}</div>
          <div class="pickers">
            <shop-select>
              <label id="sizeLabel" prefix>Size</label>
              <select id="sizeSelect" aria-labelledby="sizeLabel">
                <option value="XS">XS</option>
                <option value="S">S</option>
                <option value="M" selected>M</option>
                <option value="L">L</option>
                <option value="XL">XL</option>
              </select>
              <shop-md-decorator aria-hidden="true">
                <shop-underline></shop-underline>
              </shop-md-decorator>
            </shop-select>
            <shop-select>
              <label id="quantityLabel" prefix>Quantity</label>
              <select id="quantitySelect" aria-labelledby="quantityLabel">
                <option value="1" selected>1</option>
                <option value="2">2</option>
                <option value="3">3</option>
                <option value="4">4</option>
                <option value="5">5</option>
              </select>
              <shop-md-decorator aria-hidden="true">
                <shop-underline></shop-underline>
              </shop-md-decorator>
            </shop-select>
          </div>
          <div class="description">
            <h2>Description</h2>
            <p>${ item ? unsafeHTML(this._unescapeText(item.description)) : null }</p>
          </div>
          <shop-button responsive>
            <button on-click="${() => this._addToCart()}" aria-label="Add this item to cart">Add to Cart</button>
          </shop-button>
        </div>
      </div>
    ` : html`
      <!--
        shop-network-warning shows a warning message when the items can't be rendered due
        to network conditions.
      -->
      <shop-network-warning hidden$="[[!failure]]"></shop-network-warning>
    `}
    `;

  }

  static get is() { return 'shop-detail'; }

  static get properties() { return {

    item: Object,

    visible: Boolean,

    failure: Boolean

  }}

  update() {
    const state = store.getState();
    const category = currentCategorySelector(state);
    this.item = currentItemSelector(state);
    this.failure = category && category.failure;
  }

  _unescapeText(text) {
    // The item description contains escaped HTML (e.g. "&lt;br&gt;"), so we need to
    // unescape it ("<br>") and set it as innerHTML.
    let elem = document.createElement('textarea');
    elem.innerHTML = text;
    return elem.textContent;
  }

  _formatPrice(price) {
    return price ? '$' + price.toFixed(2) : '';
  }

  _addToCart() {
    const quantitySelect = this.shadowRoot.querySelector('#quantitySelect');
    const sizeSelect = this.shadowRoot.querySelector('#sizeSelect');
    store.dispatch(addCartEntry({
      item: this.item,
      quantity: parseInt(quantitySelect.value, 10),
      size: sizeSelect.value
    }));
  }

  _isDefined(item) {
    return item != null;
  }

}

customElements.define(ShopDetail.is, ShopDetail);
