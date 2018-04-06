import { PolymerElement, html } from '@polymer/polymer/polymer-element.js';
import '@polymer/iron-flex-layout/iron-flex-layout.js';
import './shop-ripple-container.js';

class ShopTab extends PolymerElement {
  static get template() {
    return html`
    <style>
      [hidden] {
        display: none !important;
      }

      :host {
        display: inline-block;
        position: relative;
      }

      #overlay {
        pointer-events: none;
        display: none;
        position: absolute;
        top: 0;
        right: 0;
        bottom: 0;
        left: 0;
        @apply --shop-tab-overlay;
      }

      :host(.shop-tabs-overlay-static-above) #overlay {
        display: block;
      }
    </style>
    <div id="overlay"></div>
    <shop-ripple-container>
      <slot></slot>
    </shop-ripple-container>
    `;
  }
  static get is() { return 'shop-tab'; }
}

customElements.define(ShopTab.is, ShopTab);
