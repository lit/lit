import { LitElement, html } from '../../node_modules/@polymer/lit-element/lit-element.js';
import './shop-tabs-overlay.js';

class ShopTabs extends LitElement {
  render() {
    return html`
    <style>
      :host {
        display: flex;
        align-items: center;
        justify-content: center;
      }

      #container {
        position: relative;
      }

      shop-tabs-overlay {
        border-bottom: 2px solid var(--app-accent-color);
      }
    </style>
    <div id="container">
      <shop-tabs-overlay target="${this.children[this.selectedIndex]}"></shop-tabs-overlay>
      <slot></slot>
    </div>`;
  }

  static get is() { return 'shop-tabs'; }

  static get properties() { return {
    /**
     * The index of the selected element.
     */
    selectedIndex: Number
  }}
}

customElements.define(ShopTabs.is, ShopTabs);
