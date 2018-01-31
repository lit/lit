import { LitElement, html } from '../../node_modules/@polymer/lit-element/lit-element.js';
import { shopButtonStyle } from './shop-button-style.js';
import '../../node_modules/@polymer/iron-icon/iron-icon.js';
import './shop-icons.js';

import { store } from '../store.js';
import { connect } from '../../node_modules/redux-helpers/connect-mixin.js';
import { fetchCategoryItems } from '../actions/categories.js';
import { currentCategorySelector } from '../reducers/categories.js';

class ShopNetworkWarning extends connect(store)(LitElement) {
  render({ offline }) {
    return html`
    <style>
      ${shopButtonStyle}

      :host {
        display: block;
        padding: 40px 20px;
        text-align: center;
        color: var(--app-secondary-color);
      }

      iron-icon {
        display: inline-block;
        width: 30px;
        height: 30px;
      }

      h1 {
        margin: 50px 0 10px 0;
        font-weight: 300;
      }

      p {
        margin: 0;
      }

      shop-button {
        margin-top: 50px;
      }

    </style>

    <div>
      ${ offline ? html`
        <iron-icon icon="perm-scan-wifi"></iron-icon>
        <h1>No internet connection</h1>
        <p>Check if your device is connected to a mobile network or WiFi.</p>
        ` : html`<h1>Couldn't reach the server</h1>`
      }
    </div>
    <shop-button>
      <button on-click="${() => this._tryReconnect()}">Try Again</button>
    </shop-button>
`;
  }

  static get is() { return 'shop-network-warning'; }

  static get properties() { return {
    offline: Boolean
  }}

  update() {
    const state = store.getState();
    this.offline = !state.network.online;
  }

  _tryReconnect() {
    store.dispatch(fetchCategoryItems(currentCategorySelector(store.getState())));
  }
}

customElements.define(ShopNetworkWarning.is, ShopNetworkWarning);
