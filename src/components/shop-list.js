/**
 * @license
 * Copyright (c) 2018 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
 */

import { PageViewElement } from './page-view-element.js';
import { html } from '../../node_modules/@polymer/lit-element/lit-element.js';
import { repeat } from '../../node_modules/lit-html/lib/repeat.js';
import { shopCommonStyle } from './shop-common-style.js';
import './shop-image.js';
import './shop-list-item.js';

import { store } from '../store.js';
import { connect } from '../../node_modules/pwa-helpers/connect-mixin.js';
import { currentCategorySelector } from '../reducers/categories.js';

class ShopList extends connect(store)(PageViewElement) {
  render({ category, failure }) {
    category = category || {};
    return html`
    <style>
      ${shopCommonStyle}

      .hero-image {
        position: relative;
        height: 320px;
        overflow: hidden;
        margin-bottom: 32px;
      }

      .grid {
        display: flex;
        flex-direction: row;
        flex-wrap: wrap;
        justify-content: space-between;
        margin: 0 10px 32px 10px;
        padding: 0;
        list-style: none;
      }

      .grid li {
        -webkit-flex: 1 1;
        flex: 1 1;
        -webkit-flex-basis: 33%;
        flex-basis: 33%;
        max-width: 33%;
      }

      .grid a {
        display:block;
        text-decoration: none;
      }

      @media (max-width: 767px) {
        .hero-image {
          display: none;
        }

        .grid  li {
          -webkit-flex-basis: 50%;
          flex-basis: 50%;
          max-width: 50%;
        }
      }

    </style>

    <shop-image
        alt="${category.title}"
        src="${category.image}"
        placeholder="${category.placeholder}" class="hero-image"></shop-image>

    <header>
      <h1>${category.title}</h1>
      <span>${this._getPluralizedQuantity(category.items)}</span>
    </header>

    ${ !failure ? html`
      <ul class="grid">
        ${repeat(this._getListItems(category.items), item => html`
          <li>
            <a href="/detail/${category.name}/${item.name}"><shop-list-item item="${item}"></shop-list-item></a>
          </li>
        `)}
      </ul>` : html`
      <shop-network-warning></shop-network-warning>`
    }

  </template>
  `;
}

  static get properties() { return {

    category: Object,

    failure: Boolean

  }}

  stateChanged(state) {
    const category = currentCategorySelector(state);
    this.category = category;
    this.failure = category && category.failure;
  }

  connectedCallback() {
    super.connectedCallback();
    this.isAttached = true;
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.isAttached = false;
  }

  _getListItems(items) {
    // Return placeholder items when the items haven't loaded yet.
    return items ? Object.values(items) : [{},{},{},{},{},{},{},{},{},{}];
  }

  _getPluralizedQuantity(items) {
    const quantity = items ? Object.keys(items).length : 0;
    if (!quantity) {
      return '';
    }
    let pluralizedQ = quantity === 1 ? 'item' : 'items';
    return  '(' + quantity + ' ' + pluralizedQ + ')';
  }

}

customElements.define('shop-list', ShopList);
