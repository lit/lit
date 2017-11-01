import { Element } from '../node_modules/@polymer/polymer/polymer-element.js';
import '../node_modules/@polymer/iron-icon/iron-icon.js';
import './shop-button.js';
import './shop-icons.js';

import { store } from './shop-redux-store.js';
import { tryReconnect } from './shop-redux-categories.js';

class ShopNetworkWarning extends Element {
  static get template() {
    return `
    <style include="shop-button">

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

    <div hidden\$="[[offline]]">
      <h1>Couldn't reach the server</h1>
    </div>
    <div hidden\$="[[!offline]]">
      <iron-icon icon="perm-scan-wifi"></iron-icon>
      <h1>No internet connection</h1>
      <p>Check if your device is connected to a mobile network or WiFi.</p>
    </div>
    <shop-button>
      <button on-click="_tryReconnect">Try Again</button>
    </shop-button>
`;
  }

  static get is() { return 'shop-network-warning'; }

  static get properties() { return {
    offline: Boolean
  }}
  
  constructor() {
    super();

    store.subscribe(() => this.update());
    this.update();
  }

  update() {
    const state = store.getState();
    this.offline = state.offline;
  }

  _tryReconnect() {
    store.dispatch(tryReconnect());
  }
}

customElements.define(ShopNetworkWarning.is, ShopNetworkWarning);
