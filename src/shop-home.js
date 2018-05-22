import { PolymerElement, html } from '@polymer/polymer/polymer-element.js';
import './shop-button.js';
import './shop-image.js';

class ShopHome extends PolymerElement {
  static get template() {
    return html`
    <style include="shop-button">

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
        --shop-image-img: {
          position: absolute;
          top: 0;
          bottom: 0;
          left: -9999px;
          right: -9999px;
          max-width: none;
        };
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

    <dom-repeat items="[[categories]]">
      <template strip-whitespace="">
        <div class="item">
          <a class="image-link" href\$="/list/[[item.name]]">
            <shop-image src="[[item.image]]" alt="[[item.title]]" placeholder-img="[[item.placeholder]]"></shop-image>
          </a>
          <h2>[[item.title]]</h2>
          <shop-button>
            <a aria-label\$="[[item.title]] Shop Now" href\$="/list/[[item.name]]">Shop Now</a>
          </shop-button>
        </div>
      </template>
    </dom-repeat>
`;
  }

  static get is() { return 'shop-home'; }

  static get properties() { return {

    categories: {
      type: Array
    },

    visible: {
      type: Boolean,
      observer: '_visibleChanged'
    }

  }}

  _visibleChanged(visible) {
    if (visible) {
      this.dispatchEvent(new CustomEvent('change-section', {
        bubbles: true, composed: true, detail: {title: 'Home'}}));
    }
  }
}

customElements.define(ShopHome.is, ShopHome);
