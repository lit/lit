import { PolymerElement, html } from '@polymer/polymer/polymer-element.js';
import '@polymer/iron-flex-layout/iron-flex-layout.js';
import { IronSelectableBehavior } from '@polymer/iron-selector/iron-selectable.js';
import './shop-tabs-overlay.js';
import { mixinBehaviors } from '@polymer/polymer/lib/legacy/class.js';

class ShopTabs extends mixinBehaviors(
  [IronSelectableBehavior], PolymerElement) {

  static get template() {
    return html`
    <style>
      :host {
        @apply --layout;
        @apply --layout-center-center;
      }

      #container {
        position: relative;
      }

      shop-tabs-overlay {
        @apply --shop-tab-overlay;
      }
    </style>
    <div id="container">
      <shop-tabs-overlay id="overlay"></shop-tabs-overlay>
      <slot></slot>
    </div>
    `;
  }

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
