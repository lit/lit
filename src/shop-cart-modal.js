import { PolymerElement, html } from '@polymer/polymer/polymer-element.js';
import '@polymer/iron-flex-layout/iron-flex-layout.js';
import '@polymer/paper-icon-button/paper-icon-button.js';
import { IronOverlayBehaviorImpl } from '@polymer/iron-overlay-behavior/iron-overlay-behavior.js';
import './shop-button.js';
import { mixinBehaviors } from '@polymer/polymer/lib/legacy/class.js';

class ShopCartModal extends mixinBehaviors(
  [IronOverlayBehaviorImpl], PolymerElement) {
  static get template() {
    return html`
    <style include="shop-button">

      :host {
        display: block;
        position: fixed;
        background-color: #FFF;
        box-shadow: 0 0 10px rgba(0, 0, 0, 0.2);
        width: 320px;
        padding: 12px;
        visibility: hidden;
        will-change: transform;
        top: 56px;
        right: 16px;
        -webkit-transform: translate3d(calc(100% + 16px), 0, 0);
        transform: translate3d(calc(100% + 16px), 0, 0);
        transition-property: visibility, -webkit-transform;
        transition-property: visibility, transform;
        transition-duration: 0.2s;
        transition-delay: 0.1s;
      }

      :host(.opened) {
        visibility: visible;
        -webkit-transform: translate3d(0, 0, 0);
        transform: translate3d(0, 0, 0);
      }

      .layout-horizontal {
        @apply --layout-horizontal;
      }

      .label {
        @apply --layout-flex;
        line-height: 24px;
        margin: 8px;
      }

      .modal-button {
        @apply --layout-flex;
        margin: 16px 8px;
      }

      .modal-button > a {
        box-sizing: border-box;
        width: 100%;
        padding: 8px 24px;
      }

      #closeBtn {
        position: absolute;
        right: 5px;
        top: 5px;
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
        }

      }

    </style>

    <div class="layout-horizontal">
      <div class="label">Added to cart</div>
    </div>
    <div class="layout-horizontal">
      <shop-button class="modal-button">
        <a href="/cart" on-click="close" id="viewCartAnchor">View Cart</a>
      </shop-button>
      <shop-button class="modal-button">
        <a href="/checkout" on-click="close">Checkout</a>
      </shop-button>
    </div>

    <paper-icon-button icon="close" id="closeBtn" aria-label="Close dialog" on-click="close"></paper-icon-button>
`;
  }

  static get is() { return 'shop-cart-modal'; }

  static get properties() { return {
    withBackdrop: {
      type: Boolean,
      value: true
    }
  }}

  ready() {
    super.ready();
    this.setAttribute('role', 'dialog');
    this.setAttribute('aria-modal', 'true');
    this.addEventListener('transitionend', (e)=>this._transitionEnd(e));
    this.addEventListener('iron-overlay-canceled', (e)=>this._onCancel(e));
  }

  _renderOpened() {
    this.restoreFocusOnClose = true;
    this.backdropElement.style.display = 'none';
    this.classList.add('opened');
  }

  _renderClosed() {
    this.classList.remove('opened');
  }

  _onCancel(e) {
    // Don't restore focus when the overlay is closed after a mouse event
    if (e.detail instanceof MouseEvent) {
      this.restoreFocusOnClose = false;
    }
  }

  _transitionEnd(e) {
    if (e.target !== this || e.propertyName !== 'transform') {
      return;
    }
    if (this.opened) {
      this._finishRenderOpened();
      this.fire('announce', 'Item added to the cart');
    } else {
      this._finishRenderClosed();
      this.backdropElement.style.display = '';
    }
  }

  get _focusableNodes() {
    return [this.$.viewCartAnchor, this.$.closeBtn];
  }

  refit() {}

  notifyResize() {}
}

customElements.define(ShopCartModal.is, ShopCartModal);
