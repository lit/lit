import { LitElement, html } from '../../node_modules/@polymer/lit-element/lit-element.js';

class ShopImage extends LitElement {
  render({ alt, placeholder, _src, _style }) {
    return html`
    <style>

      :host {
        display: block;
        position: relative;
      }

      #placeholder {
        position: absolute;
        top: 0;
        bottom: 0;
        left: 0;
        right: 0;
        overflow: hidden;
        background-size: cover;
        background-position: center;
      }

      img {
        max-width: 100%;
        max-height: 100%;
        margin: 0 auto;
        opacity: 0;
        transition: 0.5s opacity;
        
        position: absolute;
        top: 0;
        bottom: 0;
        left: -9999px;
        right: -9999px;
        max-width: none;
      }

    </style>

    <div id="placeholder" style="${`background-image: url('${placeholder}')`}">
      <img src="${_src}"
          alt="${alt}"
          style="${_style}"
          on-load="${() => this._onImgLoad()}"
          on-error="${() => this._onImgError()}">
    </div>
`;
  }

  static get is() { return 'shop-image'; }

  static get properties() { return {

    alt: String,

    src: String,

    placeholder: String,

    _src: String,

    _style: String

  }}

  _propertiesChanged(props, changed, oldProps) {
    if (changed && 'src' in changed) {
      this._srcChanged();
    }
    super._propertiesChanged(props, changed, oldProps);
  }

  async _srcChanged() {
    this._src = '';
    this._style = 'opacity: 0';
    await this.nextRendered;
    if (this.src) {
      this._src = this.src;
    }
  }

  _onImgLoad() {
    this._style = 'transition: 0.5s opacity; opacity: 1';
  }

  _onImgError() {
    if (!this.placeholderImg) {
      this._src = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="#CCC" d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/></svg>');
    }
  }
}

customElements.define(ShopImage.is, ShopImage);
