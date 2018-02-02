import { LitElement, html } from '../../node_modules/@polymer/lit-element/lit-element.js';

class ShopSnackbar extends LitElement {
  render() {
    return html`
    <style>
      :host {
        display: block;
        position: fixed;
        left: calc(50% - 160px);
        right: calc(50% - 160px);
        bottom: 0;
        background-color: var(--app-primary-color);
        box-shadow: 0 0 10px rgba(0, 0, 0, 0.2);
        color: white;
        width: 320px;
        padding: 12px;
        visibility: hidden;
        text-align: center;
        will-change: transform;
        -webkit-transform: translate3d(0, 100%, 0);
        transform: translate3d(0, 100%, 0);
        transition-property: visibility, -webkit-transform, opacity;
        transition-property: visibility, transform, opacity;
        transition-duration: 0.2s;
      }
      :host(.opened) {
        visibility: visible;
        -webkit-transform: translate3d(0, 0, 0);
        transform: translate3d(0, 0, 0);
      }
      @media (max-width: 767px) {
        :host {
          top: auto;
          bottom: 0;
          left: 0;
          right: 0;
          width: auto;
          -webkit-transform: translate3d(0, 100%, 0);
          transform: translate3d(0, 100%, 0);
          z-index: 1;
        }
      }
    </style>

    <slot></slot>
`;
  }

  static get is() { return 'shop-snackbar'; }
}

customElements.define(ShopSnackbar.is, ShopSnackbar);
