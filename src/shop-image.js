import { PolymerElement, html } from '@polymer/polymer/polymer-element.js';
import '@polymer/iron-flex-layout/iron-flex-layout.js';

class ShopImage extends PolymerElement {
  static get template() {
    return html`
    <style>

      :host {
        display: block;
        position: relative;
        overflow: hidden;
        background-size: cover;
        background-position: center;
      }

      img {
        @apply --layout-fit;
        max-width: 100%;
        max-height: 100%;
        margin: 0 auto;
        opacity: 0;
        transition: 0.5s opacity;
        @apply --shop-image-img;
      }

    </style>

    <img id="img" alt\$="[[alt]]" on-load="_onImgLoad" on-error="_onImgError">
`;
  }

  static get is() { return 'shop-image'; }

  static get properties() { return {

    alt: String,

    src: {
      type: String,
      observer: '_srcChanged'
    },

    placeholderImg: {
      type: String,
      observer: '_placeholderImgChanged'
    }

  }}

  _srcChanged(src) {
    this.$.img.removeAttribute('src');
    this.$.img.style.transition = '';
    this.$.img.style.opacity = 0;
    if (src) {
      this.$.img.src = src;
    }
  }

  _onImgLoad() {
    this.$.img.style.transition = '0.5s opacity';
    this.$.img.style.opacity = 1;
  }

  _onImgError() {
    if (!this.placeholderImg) {
      this.$.img.src = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="#CCC" d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/></svg>');
    }
  }

  _placeholderImgChanged(placeholder) {
    this.style.backgroundImage = 'url(\'' + placeholder + '\')';
  }
}

customElements.define(ShopImage.is, ShopImage);
