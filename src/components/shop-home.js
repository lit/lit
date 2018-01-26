import { LitElement, html } from '../../node_modules/@polymer/lit-element/lit-element.js';
import { repeat } from '../../node_modules/lit-html/lib/repeat.js';
import { shopButtonStyle } from './shop-button-style.js';
import './shop-image.js';

import { store } from '../store.js';
import { connect } from '../../node_modules/redux-helpers/connect-mixin.js';
import { updateMeta } from '../actions/meta.js';

class ShopHome extends connect(store)(LitElement) {
  render({ categories }) {
    return html`
    ${ shopButtonStyle }
    <style>

      .image-link {
        outline: none;
      }

      .image-link > shop-image::after {
        display: block;
        content: '';
        position: absolute;
        transition-property: opacity;
        transition-duration: 0s;
        transition-delay: 90ms;
        pointer-events: none;
        opacity: 0;
        top: 5px;
        left: 5px;
        right: 5px;
        bottom: 5px;
        outline: #2196F3 auto 5px;
        outline: -moz-mac-focusring auto 5px;
        outline: -webkit-focus-ring-color auto 5px;
      }

      .image-link:focus > shop-image::after {
        opacity: 1;
      }

      .item {
        display: block;
        text-decoration: none;
        text-align: center;
        margin-bottom: 40px;
      }

      .item:nth-of-type(3),
      .item:nth-of-type(4) {
        display: inline-block;
        width: 50%;
      }

      shop-image {
        position: relative;
        height: 320px;
        overflow: hidden;
      }

      h2 {
        font-size: 1.3em;
        font-weight: 500;
        margin: 32px 0;
      }

      .item:nth-of-type(3) > h2,
      .item:nth-of-type(4) > h2 {
        font-size: 1.1em;
      }

      @media (max-width: 767px) {
        shop-image {
          height: 240px;
        }

        h2 {
          margin: 24px 0;
        }

        .item:nth-of-type(3) > shop-button > a,
        .item:nth-of-type(4) > shop-button > a {
          padding: 8px 24px;
        }
      }

    </style>

    ${repeat(categories, category => html`<div class="item">
        <a class="image-link" href$="/list/${category.name}">
          <shop-image src="${category.image}" alt="${category.title}" placeholder="${category.placeholder}"></shop-image>
        </a>
        <h2>${category.title}</h2>
        <shop-button>
          <a aria-label$="${category.title} Shop Now" href$="/list/${category.name}">Shop Now</a>
        </shop-button>
      </div>`)}
`;
  }

  static get is() { return 'shop-home'; }

  static get properties() { return {

    categories: {
      type: Array
    }

  }}

  update() {
    const state = store.getState();
    this.categories = Object.values(state.categories);
  }
}

customElements.define(ShopHome.is, ShopHome);
