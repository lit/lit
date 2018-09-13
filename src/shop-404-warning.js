import { PolymerElement, html } from '@polymer/polymer/polymer-element.js';
import '@polymer/iron-icon/iron-icon.js';
import './shop-button.js';
import './shop-icons.js';

class Shop404Warning extends PolymerElement {
  static get template() {
    return html`
    <style include="shop-button">

      :host {
        display: block;
        text-align: center;
        color: var(--app-secondary-color);
      }

      iron-icon {
        display: inline-block;
        width: 60px;
        height: 60px;
      }

      h1 {
        margin: 50px 0 50px 0;
        font-weight: 300;
      }

    </style>

    <div>
      <iron-icon icon="error"></iron-icon>
      <h1>Sorry, we couldn't find that page</h1>
    </div>
    <shop-button>
      <a href="/">Go to the home page</a>
    </shop-button>
`;
  }

  static get is() { return 'shop-404-warning'; }
}

customElements.define(Shop404Warning.is, Shop404Warning);
