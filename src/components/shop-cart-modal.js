/**
 * @license
 * Copyright (c) 2018 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
 */

import { Element } from '../../node_modules/@polymer/polymer/polymer-element.js';
import '../../node_modules/@polymer/paper-icon-button/paper-icon-button.js';
import { IronOverlayBehaviorImpl } from '../../node_modules/@polymer/iron-overlay-behavior/iron-overlay-behavior.js';
import { mixinBehaviors } from '../../node_modules/@polymer/polymer/lib/legacy/class.js';
import { shopButtonStyle } from './shop-button-style.js';

import { store } from '../store.js';
import { connect } from '../../node_modules/pwa-helpers/connect-mixin.js';
import modal from '../reducers/modal.js';
import { closeModal } from '../actions/modal.js';

store.addReducers({
  modal
});

class ShopCartModal extends connect(store)(mixinBehaviors(
  [IronOverlayBehaviorImpl], Element)) {
  static get template() {
    return `
    <style>
      ${shopButtonStyle}

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
        display: flex;
        flex-direction: row;
      }

      .label {
        flex: 1;
        line-height: 24px;
        margin: 8px;
      }

      .modal-button {
        flex: 1;
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

  stateChanged() {
    const state = store.getState();
    this.setProperties({
      opened: state.modal
    });
  }

  ready() {
    super.ready();
    this.setAttribute('role', 'dialog');
    this.setAttribute('aria-modal', 'true');
    this.addEventListener('transitionend', (e)=>this._transitionEnd(e));
    this.addEventListener('iron-overlay-canceled', (e)=>this._onCancel(e));
    this.addEventListener('opened-changed', () => {
      // NOTE: Don't dispatch if modal.opened became false due to time
      // travelling (i.e. state.modal is already false).
      // This check is generally needed whenever you have both UI updating
      // state and state updating the same UI.
      if (!this.opened && store.getState().modal) {
        store.dispatch(closeModal());
      }
    });
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
