import { Element } from '../node_modules/@polymer/polymer/polymer-element.js';
import '../node_modules/@polymer/iron-flex-layout/iron-flex-layout.js';
import { IronSelectableBehavior } from '../node_modules/@polymer/iron-selector/iron-selectable.js';
import './shop-tabs-overlay.js';
import { mixinBehaviors } from '../node_modules/@polymer/polymer/lib/legacy/class.js';
const $_documentContainer = document.createElement('div');
$_documentContainer.setAttribute('style', 'display: none;');

$_documentContainer.innerHTML = `<dom-module id="shop-tabs">
  <template strip-whitespace="">
    <style>
      :host {
        @apply --layout;
        @apply --layout-center-center;
      }

      #container {
        position: relative;
      }

      shop-tabs-overlay {
        border-bottom: 2px solid var(--app-accent-color);
      }
    </style>
    <div id="container">
      <shop-tabs-overlay id="overlay"></shop-tabs-overlay>
      <slot></slot>
    </div>
  </template>
  
</dom-module>`;

document.head.appendChild($_documentContainer);

class ShopTabs extends mixinBehaviors(
  [IronSelectableBehavior], Element) {

  static get is() { return 'shop-tabs'; }

  static get observers() { return [
    '_onSelectedItemChanged(selectedItem)'
  ]}

  _onSelectedItemChanged(selectedItem) {
    if (selectedItem === undefined && this.selected) return;

    this.$.overlay.target = selectedItem;
  }
}

customElements.define(ShopTabs.is, ShopTabs);
