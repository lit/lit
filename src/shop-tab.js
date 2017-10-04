import { Element } from '../node_modules/@polymer/polymer/polymer-element.js';
import '../node_modules/@polymer/iron-flex-layout/iron-flex-layout.js';
import './shop-ripple-container.js';
const $_documentContainer = document.createElement('div');
$_documentContainer.setAttribute('style', 'display: none;');

$_documentContainer.innerHTML = `<dom-module id="shop-tab">
  <template strip-whitespace="">
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
  </template>
  
</dom-module>`;

document.head.appendChild($_documentContainer);
class ShopTab extends Element {
  static get is() { return 'shop-tab'; }
}

customElements.define(ShopTab.is, ShopTab);
