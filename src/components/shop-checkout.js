import { LitElement, html } from '../../node_modules/@polymer/lit-element/lit-element.js';
import { repeat } from '../../node_modules/lit-html/lib/repeat.js';
import { shopButtonStyle } from './shop-button-style.js';
import { shopCheckboxStyle } from'./shop-checkbox-style.js';
import { shopCommonStyle } from './shop-common-style.js';
import { shopFormStyle } from './shop-form-style.js';
import { shopInputStyle } from'./shop-input-style.js';
import { shopSelectStyle } from './shop-select-style.js';
import { Debouncer } from '../../node_modules/@polymer/polymer/lib/utils/debounce.js';
import { timeOut } from '../../node_modules/@polymer/polymer/lib/utils/async.js';

import { store } from '../store.js';
import { connect } from '../../node_modules/redux-helpers/connect-mixin.js';
import { totalSelector } from '../reducers/cart.js';
import { pushState } from '../actions/location.js';
import { updateCheckoutState } from '../actions/checkout.js';
import { clearCart } from '../actions/cart.js';
import { announceLabel } from '../actions/announcer.js';
import checkout from '../reducers/checkout.js';

store.addReducers({
  checkout
});

class ShopCheckout extends connect(store)(LitElement) {
  render({ cart, response, state, total, waiting }) {
    return html`
    <style>
      ${shopButtonStyle}
      ${shopCheckboxStyle}
      ${shopCommonStyle}
      ${shopFormStyle}
      ${shopInputStyle}
      ${shopSelectStyle}

      .main-frame {
        transition: opacity 0.5s;
      }

      :host([waiting]) .main-frame {
        opacity: 0.1;
      }

      shop-input, shop-select {
        font-size: 16px;
      }

      shop-select {
        margin-bottom: 20px;
      }

      paper-spinner-lite {
        position: fixed;
        top: calc(50% - 14px);
        left: calc(50% - 14px);
      }

      .billing-address-picker {
        margin: 28px 0;
        height: 20px;
        display: flex;
      }

      .billing-address-picker > label {
        margin-left: 12px;
      }

      .grid {
        margin-top: 40px;
        display: flex;
      }

      .grid > section {
        flex: 1;
      }

      .grid > section:not(:first-child) {
        margin-left: 80px;
      }

      .row {
        display: flex;
        align-items: flex-end;
      }

      .column {
        display: flex;
        flex-direction: column;
      }

      .row > .flex,
      .input-row > * {
        flex: 1;
      }

      .input-row > *:not(:first-child) {
        margin-left: 8px;
      }

      .shop-select-label {
        line-height: 20px;
      }

      .order-summary-row {
        line-height: 24px;
      }

      .total-row {
        font-weight: 500;
        margin: 30px 0;
      }

      @media (max-width: 767px) {

        .grid {
          display: block;
          margin-top: 0;
        }

        .grid > section:not(:first-child) {
          margin-left: 0;
        }

      }

    </style>

    <div class="main-frame">
      ${ state === 'init' ? html`
        <div state="init">
          <iron-form id="checkoutForm"
              on-iron-form-response="_didReceiveResponse"
              on-iron-form-presubmit="_willSendRequest">
            <form method="post" action="data/sample_success_response.json" enctype="application/x-www-form-urlencoded">
              ${ cart.length === 0 ? html`
                <div class="subsection">
                  <p class="empty-cart">Your <iron-icon icon="shopping-cart"></iron-icon> is empty.</p>
                </div>` : html`
                <header class="subsection">
                  <h1>Checkout</h1>
                  <span>Shop is a demo app - form data will not be sent</span>
                </header>

                <div class="subsection grid">
                  <section>
                    <h2 id="accountInfoHeading">Account Information</h2>
                    <div class="row input-row">
                      <shop-input>
                        <input type="email" id="accountEmail" name="accountEmail"
                            placeholder="Email" autofocus required
                            aria-labelledby="accountEmailLabel accountInfoHeading">
                        <shop-md-decorator error-message="Invalid Email" aria-hidden="true">
                          <label id="accountEmailLabel">Email</label>
                          <shop-underline></shop-underline>
                        </shop-md-decorator>
                      </shop-input>
                    </div>
                    <div class="row input-row">
                      <shop-input>
                        <input type="tel" id="accountPhone" name="accountPhone" pattern="\\d{10,}"
                            placeholder="Phone Number" required
                            aria-labelledby="accountPhoneLabel accountInfoHeading">
                        <shop-md-decorator error-message="Invalid Phone Number" aria-hidden="true">
                          <label id="accountPhoneLabel">Phone Number</label>
                          <shop-underline></shop-underline>
                        </shop-md-decorator>
                      </shop-input>
                    </div>
                    <h2 id="shipAddressHeading">Shipping Address</h2>
                    <div class="row input-row">
                      <shop-input>
                        <input type="text" id="shipAddress" name="shipAddress" pattern=".{5,}"
                            placeholder="Address" required
                            aria-labelledby="shipAddressLabel shipAddressHeading">
                        <shop-md-decorator error-message="Invalid Address" aria-hidden="true">
                          <label id="shipAddressLabel">Address</label>
                          <shop-underline></shop-underline>
                        </shop-md-decorator>
                      </shop-input>
                    </div>
                    <div class="row input-row">
                      <shop-input>
                        <input type="text" id="shipCity" name="shipCity" pattern=".{2,}"
                            placeholder="City" required
                            aria-labelledby="shipCityLabel shipAddressHeading">
                        <shop-md-decorator error-message="Invalid City" aria-hidden="true">
                          <label id="shipCityLabel">City</label>
                          <shop-underline></shop-underline>
                        </shop-md-decorator>
                      </shop-input>
                    </div>
                    <div class="row input-row">
                      <shop-input>
                        <input type="text" id="shipState" name="shipState" pattern=".{2,}"
                            placeholder="State/Province" required
                            aria-labelledby="shipStateLabel shipAddressHeading">
                        <shop-md-decorator error-message="Invalid State/Province" aria-hidden="true">
                          <label id="shipStateLabel">State/Province</label>
                          <shop-underline></shop-underline>
                        </shop-md-decorator>
                      </shop-input>
                      <shop-input>
                        <input type="text" id="shipZip" name="shipZip" pattern=".{4,}"
                            placeholder="Zip/Postal Code" required
                            aria-labelledby="shipZipLabel shipAddressHeading">
                        <shop-md-decorator error-message="Invalid Zip/Postal Code" aria-hidden="true">
                          <label id="shipZipLabel">Zip/Postal Code</label>
                          <shop-underline></shop-underline>
                        </shop-md-decorator>
                      </shop-input>
                    </div>
                    <div class="column">
                      <label id="shipCountryLabel" class="shop-select-label">Country</label>
                      <shop-select>
                        <select id="shipCountry" name="shipCountry" required
                            aria-labelledby="shipCountryLabel shipAddressHeading">
                          <option value="US" selected>United States</option>
                          <option value="CA">Canada</option>
                        </select>
                        <shop-md-decorator aria-hidden="true">
                          <shop-underline></shop-underline>
                        </shop-md-decorator>
                      </shop-select>
                    </div>
                    <h2 id="billAddressHeading">Billing Address</h2>
                    <div class="billing-address-picker">
                      <shop-checkbox>
                        <input type="checkbox" id="setBilling" name="setBilling"
                            checked$="[[hasBillingAddress]]" on-change="_toggleBillingAddress">
                        <shop-md-decorator></shop-md-decorator aria-hidden="true">
                      </shop-checkbox>
                      <label for="setBilling">Use different billing address</label>
                    </div>
                    <div hidden$="[[!hasBillingAddress]]">
                      <div class="row input-row">
                        <shop-input>
                          <input type="text" id="billAddress" name="billAddress" pattern=".{5,}"
                              placeholder="Address" required$="[[hasBillingAddress]]"
                              autocomplete="billing street-address"
                              aria-labelledby="billAddressLabel billAddressHeading">
                          <shop-md-decorator error-message="Invalid Address" aria-hidden="true">
                            <label id="billAddressLabel">Address</label>
                            <shop-underline></shop-underline>
                          </shop-md-decorator>
                        </shop-input>
                      </div>
                      <div class="row input-row">
                        <shop-input>
                          <input type="text" id="billCity" name="billCity" pattern=".{2,}"
                              placeholder="City" required$="[[hasBillingAddress]]"
                              autocomplete="billing address-level2"
                              aria-labelledby="billCityLabel billAddressHeading">
                          <shop-md-decorator error-message="Invalid City" aria-hidden="true">
                            <label id="billCityLabel">City</label>
                            <shop-underline></shop-underline>
                          </shop-md-decorator>
                        </shop-input>
                      </div>
                      <div class="row input-row">
                        <shop-input>
                          <input type="text" id="billState" name="billState" pattern=".{2,}"
                              placeholder="State/Province" required$="[[hasBillingAddress]]"
                              autocomplete="billing address-level1"
                              aria-labelledby="billStateLabel billAddressHeading">
                          <shop-md-decorator error-message="Invalid State/Province" aria-hidden="true">
                            <label id="billStateLabel">State/Province</label>
                            <shop-underline></shop-underline>
                          </shop-md-decorator>
                        </shop-input>
                        <shop-input>
                          <input type="text" id="billZip" name="billZip" pattern=".{4,}"
                              placeholder="Zip/Postal Code" required$="[[hasBillingAddress]]"
                              autocomplete="billing postal-code"
                              aria-labelledby="billZipLabel billAddressHeading">
                          <shop-md-decorator error-message="Invalid Zip/Postal Code" aria-hidden="true">
                            <label id="billZipLabel">Zip/Postal Code</label>
                            <shop-underline></shop-underline>
                          </shop-md-decorator>
                        </shop-input>
                      </div>
                      <div class="column">
                        <label id="billCountryLabel" class="shop-select-label">Country</label>
                        <shop-select>
                          <select id="billCountry" name="billCountry" required$="[[hasBillingAddress]]"
                              autocomplete="billing country"
                              aria-labelledby="billCountryLabel billAddressHeading">
                            <option value="US" selected>United States</option>
                            <option value="CA">Canada</option>
                          </select>
                          <shop-md-decorator aria-hidden="true">
                            <shop-underline></shop-underline>
                          </shop-md-decorator>
                        </shop-select>
                      </div>
                    </div>
                  </section>

                  <section>
                    <h2>Payment Method</h2>
                    <div class="row input-row">
                      <shop-input>
                        <input type="text" id="ccName" name="ccName" pattern=".{3,}"
                            placeholder="Cardholder Name" required
                            autocomplete="cc-name">
                        <shop-md-decorator error-message="Invalid Cardholder Name" aria-hidden="true">
                          <label for="ccName">Cardholder Name</label>
                          <shop-underline></shop-underline>
                        </shop-md-decorator>
                      </shop-input>
                    </div>
                    <div class="row input-row">
                      <shop-input>
                        <input type="tel" id="ccNumber" name="ccNumber" pattern="[\\d\\s]{15,}"
                            placeholder="Card Number" required
                            autocomplete="cc-number">
                        <shop-md-decorator error-message="Invalid Card Number" aria-hidden="true">
                          <label for="ccNumber">Card Number</label>
                          <shop-underline></shop-underline>
                        </shop-md-decorator>
                      </shop-input>
                    </div>
                    <div class="row input-row">
                      <div class="column">
                        <label for="ccExpMonth">Expiry</label>
                        <shop-select>
                          <select id="ccExpMonth" name="ccExpMonth" required
                              autocomplete="cc-exp-month" aria-label="Expiry month">
                            <option value="01" selected>Jan</option>
                            <option value="02">Feb</option>
                            <option value="03">Mar</option>
                            <option value="04">Apr</option>
                            <option value="05">May</option>
                            <option value="06">Jun</option>
                            <option value="07">Jul</option>
                            <option value="08">Aug</option>
                            <option value="09">Sep</option>
                            <option value="10">Oct</option>
                            <option value="11">Nov</option>
                            <option value="12">Dec</option>
                          </select>
                          <shop-md-decorator aria-hidden="true">
                            <shop-underline></shop-underline>
                          </shop-md-decorator>
                        </shop-select>
                      </div>
                      <shop-select>
                        <select id="ccExpYear" name="ccExpYear" required
                            autocomplete="cc-exp-year" aria-label="Expiry year">
                          <option value="2016" selected>2016</option>
                          <option value="2017">2017</option>
                          <option value="2018">2018</option>
                          <option value="2019">2019</option>
                          <option value="2020">2020</option>
                          <option value="2021">2021</option>
                          <option value="2022">2022</option>
                          <option value="2023">2023</option>
                          <option value="2024">2024</option>
                          <option value="2025">2025</option>
                          <option value="2026">2026</option>
                        </select>
                        <shop-md-decorator aria-hidden="true">
                          <shop-underline></shop-underline>
                        </shop-md-decorator>
                      </shop-select>
                      <shop-input>
                        <input type="tel" id="ccCVV" name="ccCVV" pattern="\\d{3,4}"
                            placeholder="CVV" required
                            autocomplete="cc-csc">
                        <shop-md-decorator error-message="Invalid CVV" aria-hidden="true">
                          <label for="ccCVV">CVV</label>
                          <shop-underline></shop-underline>
                        </shop-md-decorator>
                      </shop-input>
                    </div>
                    <h2>Order Summary</h2>
                    ${repeat(cart, entry => html`
                      <div class="row order-summary-row">
                        <div class="flex">${entry.item.title}</div>
                        <div>$${(entry.quantity * entry.item.price).toFixed(2)}</div>
                      </div>
                    `)}
                    <div class="row total-row">
                      <div class="flex">Total</div>
                      <div>${isNaN(total) ? '' : '$' + total.toFixed(2)}</div>
                    </div>
                    <shop-button responsive id="submitBox">
                      <input type="button" on-click="_submit" value="Place Order">
                    </shop-button>
                  </section>
                </div>`
              }
            </form>
          </iron-form>
        </div>` : state === 'success' ? html`
        <!-- Success message UI -->
        <header state="success">
          <h1>Thank you</h1>
          <p>${response.successMessage}</p>
          <shop-button responsive>
            <a href="/">Finish</a>
          </shop-button>
        </header>` : html`
        <!-- Error message UI -->
        <header state="error">
          <h1>We couldn&acute;t process your order</h1>
          <p id="errorMessage">${response.errorMessage}</p>
          <shop-button responsive>
            <a href="/checkout">Try again</a>
          </shop-button>
        </header>`
      }
    </div>

    <!-- Show spinner when waiting for the server to repond -->
    <paper-spinner-lite active="${waiting}"></paper-spinner-lite>
    `;
  }
  static get is() { return 'shop-checkout'; }

  static get properties() { return {

    /**
     * The total price of the contents in the user's cart.
     */
    total: Number,

    /**
     * The state of the form. Valid values are:
     * `init`, `success` and `error`.
     */
    state: {
      type: String
    },

    /**
     * An array containing the items in the cart.
     */
    cart: Array,

    /**
     * The server's response.
     */
    response: Object,

    /**
     * If true, the user must enter a billing address.
     */
    hasBillingAddress: {
      type: Boolean,
      value: false
    },

    /**
     * If true, shop-checkout is currently visible on the screen.
     */
    visible: {
      type: Boolean,
      observer: '_visibleChanged'
    },

    /**
     * True when waiting for the server to repond.
     */
    waiting: {
      type: Boolean,
      readOnly: true,
      reflectToAttribute: true
    }

  }}

  update() {
    const state = store.getState();
    this.cart = state.cart ? Object.values(state.cart) : [];
    this.total = totalSelector(state);
    this.state = state.checkout.state;
  }

  _submit(e) {
    if (this._validateForm()) {
      // To send the form data to the server:
      // 2) Remove the code below.
      // 3) Uncomment `this.$.checkoutForm.submit()`.

      this.$.checkoutForm.dispatchEvent(new CustomEvent('iron-form-presubmit', {
        composed: true}));

      this._submitFormDebouncer = Debouncer.debounce(this._submitFormDebouncer,
        timeOut.after(1000), () => {
          this.$.checkoutForm.dispatchEvent(new CustomEvent('iron-form-response', {
            composed: true, detail: {
              response: {
                success: 1,
                successMessage: 'Demo checkout process complete.'
              }
            }}));
        });

      // this.$.checkoutForm.submit();
    }
  }

  /**
   * Sets the valid state and updates the location.
   */
  _pushState(state) {
    // This changes window.location only - it does not affect the checkout state.
    store.dispatch(pushState(`${window.location.origin}/checkout/${state}`));
    
    // The only way to update checkout state is with the updateCheckoutState
    // action. This is to prevent an user from navigating directly to the
    // success/error pages.
    store.dispatch(updateCheckoutState(state));
  }

  /**
   * Sets the initial state.
   */
  _reset() {
    let form = this.$.checkoutForm;

    this._setWaiting(false);
    form.reset && form.reset();

    let nativeForm = form._form;
    if (!nativeForm) {
      return;
    }

    // Remove the `aria-invalid` attribute from the form inputs.
    for (let el, i = 0; el = nativeForm.elements[i], i < nativeForm.elements.length; i++) {
      el.removeAttribute('aria-invalid');
    }
  }

  /**
   * Validates the form's inputs and adds the `aria-invalid` attribute to the inputs
   * that don't match the pattern specified in the markup.
   */
  _validateForm() {
    let form = this.$.checkoutForm;
    let firstInvalid = false;
    let nativeForm = form._form;

    for (let el, i = 0; el = nativeForm.elements[i], i < nativeForm.elements.length; i++) {
      if (el.checkValidity()) {
        el.removeAttribute('aria-invalid');
      } else {
        if (!firstInvalid) {
          // announce error message
          if (el.nextElementSibling) {
            store.dispatch(announceLabel(el.nextElementSibling.getAttribute('error-message')));
          }
          if (el.scrollIntoViewIfNeeded) {
            // safari, chrome
            el.scrollIntoViewIfNeeded();
          } else {
            // firefox, edge, ie
            el.scrollIntoView(false);
          }
          el.focus();
          firstInvalid = true;
        }
        el.setAttribute('aria-invalid', 'true');
      }
    }
    return !firstInvalid;
  }

  /**
   * Adds the cart data to the payload that will be sent to the server
   * and updates the UI to reflect the waiting state.
   */
  _willSendRequest(e) {
    let form = e.target;
    let body = form.request && form.request.body;

    this._setWaiting(true);

    if (!body) {
      return;
    }
    // Populate the request body where `cartItemsId[i]` is the ID and `cartItemsQuantity[i]`
    // is the quantity for some item `i`.
    body.cartItemsId = [];
    body.cartItemsQuantity = [];

    this.cart.forEach((cartItem) => {
      body.cartItemsId.push(cartItem.item.name);
      body.cartItemsQuantity.push(cartItem.quantity);
    });
  }

  /**
   * Handles the response from the server by checking the response status
   * and transitioning to the success or error UI.
   */
  _didReceiveResponse(e) {
    let response = e.detail.response;

    this.response = response;
    this._setWaiting(true);

    if (response.success) {
      this._pushState('success');
      this._reset();
      this.dispatchEvent(new CustomEvent('clear-cart', {bubbles: true, composed: true}));
      store.dispatch(clearCart());
    } else {
      this._pushState('error');
    }
  }

  _toggleBillingAddress(e) {
    this.hasBillingAddress = e.target.checked;

    if (this.hasBillingAddress) {
      this.$.billAddress.focus();
    }
  }

  _visibleChanged(visible) {
    if (!visible) {
      return;
    }
    // Reset the UI states
    this._reset();
  }

}

customElements.define(ShopCheckout.is, ShopCheckout);
