import { LitElement, html } from '../../node_modules/@polymer/lit-element/lit-element.js';
import { repeat } from '../../node_modules/lit-html/lib/repeat.js';
import '../../node_modules/@polymer/app-layout/app-header/app-header.js';
import '../../node_modules/@polymer/app-layout/app-scroll-effects/effects/waterfall.js';
import '../../node_modules/@polymer/app-layout/app-toolbar/app-toolbar.js';
import { scroll } from '../../node_modules/@polymer/app-layout/helpers/helpers.js';
import '../../node_modules/@polymer/iron-pages/iron-pages.js';
import '../../node_modules/@polymer/iron-selector/iron-selector.js';
import './shop-home.js';
import { afterNextRender } from '../../node_modules/@polymer/polymer/lib/utils/render-status.js';
import { timeOut } from '../../node_modules/@polymer/polymer/lib/utils/async.js';

import { store } from '../store.js';
import { connect } from '../../node_modules/redux-helpers/connect-mixin.js';
import { pageSelector } from '../reducers/location.js';
import { currentCategorySelector, currentItemSelector } from '../reducers/categories.js';
import { installRouter } from '../../node_modules/redux-helpers/router.js';
import { installNetwork } from '../network.js';
import { updateLocation } from '../actions/location.js';
import { updateMeta } from '../actions/meta.js';
import { fetchCategoryItems, fetchCategories } from '../actions/categories.js';

class ShopApp extends connect(store)(LitElement) {
  render({ categories, categoryName, drawerOpened, loadComplete, modalOpened, offline, page, _a11yLabel, _smallScreen, _snackbarOpened }) {
    return html`
    <style>

      :host {
        display: block;
        position: relative;
        padding-top: 130px;
        padding-bottom: 64px;
        min-height: 100vh;
        --app-primary-color: #202020;
        --app-secondary-color: #757575;
        --app-accent-color: #172C50;
        --paper-button-ink-color: var(--app-accent-color);
        --paper-icon-button-ink-color: var(--app-accent-color);
        --paper-spinner-color: var(--app-accent-color);
        -webkit-tap-highlight-color: rgba(0, 0, 0, 0);
        color: var(--app-primary-color);
      }

      app-header {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        z-index: 1;
        background-color: rgba(255, 255, 255, 0.95);
        --app-header-shadow: {
          box-shadow: inset 0px 5px 6px -3px rgba(0, 0, 0, 0.2);
          height: 10px;
          bottom: -10px;
        };
      }

      paper-icon-button {
        color: var(--app-primary-color);
      }

      .logo {
        text-align: center;
      }

      .logo a {
        font-size: 16px;
        font-weight: 600;
        letter-spacing: 0.3em;
        color: var(--app-primary-color);
        text-decoration: none;
        /* required for IE 11, so this <a> can receive pointer events */
        display: inline-block;
        pointer-events: auto;
      }

      .left-bar-item {
        width: 40px;
      }

      shop-cart-button {
        display: block;
        width: 40px;
      }

      .announcer {
        position: fixed;
        height: 0;
        overflow: hidden;
      }

      #tabContainer {
        position: relative;
        height: 66px;
      }

      shop-tabs {
        height: 100%;
      }

      shop-tab {
        margin: 0 10px;
      }

      shop-tab a {
        display: inline-block;
        outline: none;
        padding: 9px 5px;
        font-size: 13px;
        font-weight: 500;
        text-decoration: none;
        color: var(--app-primary-color);
      }

      .drawer-list {
        margin: 0 20px;
      }

      .drawer-list a {
        display: block;
        padding: 0 16px;
        line-height: 40px;
        text-decoration: none;
        color: var(--app-secondary-color);
      }

      .drawer-list a.iron-selected {
        color: black;
        font-weight: bold;
      }

      shop-cart-modal {
        z-index: 2;
      }

      app-drawer {
        z-index: 3;
      }

      iron-pages {
        max-width: 1440px;
        margin: 0 auto;
      }

      footer {
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        text-align: center;
        margin-top: 20px;
        line-height: 24px;
      }

      footer > a {
        color: var(--app-secondary-color);
        text-decoration: none;
      }

      footer > a:hover {
        text-decoration: underline;
      }

      .demo-label {
        box-sizing: border-box;
        width: 120px;
        padding: 6px;
        margin: 8px auto 0;
        background-color: var(--app-primary-color);
        color: white;
        text-transform: uppercase;
      }

      /* small screen */
      @media (max-width: 767px) {
        :host {
          padding-top: 64px;
        }
      }

    </style>

    <shop-analytics key="UA-39334307-16"></shop-analytics>

    <app-header role="navigation" id="header" effects="waterfall" condenses="" reveals="">
      <app-toolbar>
        <div class="left-bar-item">
          <paper-icon-button class="menu-btn" icon="menu"
              on-click="${_ => this.drawerOpened = true}"
              aria-label="Categories"
              hidden="${!_smallScreen || page === 'detail'}">
          </paper-icon-button>
          <a class="back-btn" href="/list/${categoryName}" tabindex="-1"
              hidden="${page !== 'detail'}">
            <paper-icon-button icon="arrow-back" aria-label="Go back"></paper-icon-button>
          </a>
        </div>
        <div class="logo" main-title=""><a href="/" aria-label="SHOP Home">SHOP</a></div>
        <shop-cart-button></shop-cart-button>
      </app-toolbar>

      <!-- Lazy-create the tabs for larger screen sizes. -->
      ${ ['home', 'list', 'detail'].indexOf(page) !== -1 && !_smallScreen && loadComplete ?
        html`
          <div id="tabContainer" sticky>
            <shop-tabs selected="${categoryName}" attr-for-selected="name">
              ${repeat(categories, category => html`
                <shop-tab name="${category.name}">
                  <a href="/list/${category.name}">${category.title}</a>
                </shop-tab>
              `)}
            </shop-tabs>
          </div>
        ` : null
      }
    </app-header>

    <!-- Lazy-create the drawer for small screen sizes. -->
    ${ _smallScreen && loadComplete ?
      html`
        <app-drawer opened="${drawerOpened}" tabindex="0" on-opened-changed="${e => this.drawerOpened = e.target.opened}">
          <iron-selector role="navigation" class="drawer-list" selected="${categoryName}" attr-for-selected="name">
            ${repeat(categories, category => html`
              <a name="${category.name}" href="/list/${category.name}">${category.title}</a>
            `)}
          </iron-selector>
        </app-drawer>
      ` : null
    }

    <iron-pages role="main" selected="${page}" attr-for-selected="name" selected-attribute="visible" fallback-selection="404">
      <!-- home view -->
      <shop-home name="home"></shop-home>
      <!-- list view of items in a category -->
      <shop-list name="list"></shop-list>
      <!-- detail view of one item -->
      <shop-detail name="detail"></shop-detail>
      <!-- cart view -->
      <shop-cart name="cart"></shop-cart>
      <!-- checkout view -->
      <shop-checkout name="checkout"></shop-checkout>

      <shop-404-warning name="404"></shop-404-warning>
    </iron-pages>

    <footer>
      <a href="https://www.polymer-project.org/1.0/toolbox/">Made by Polymer</a>
      <div class="demo-label">Demo Only</div>
    </footer>

    <!-- a11y announcer -->
    <div class="announcer" aria-live="assertive">${_a11yLabel}</div>

    ${ modalOpened ? html`<shop-cart-modal></shop-cart-modal>` : null }
    ${ loadComplete ? html`<shop-snackbar class$="${_snackbarOpened ? 'opened' : ''}">${offline ? 'You are offline' : 'You are online'}</shop-snackbar>` : null }
    `;
  }

  static get is() { return 'shop-app'; }

  static get properties() { return {
    page: String,

    offline: Boolean,

    meta: Object,
    
    modalOpened: Object,

    categories: Object,

    categoryName: String,

    drawerOpened: Boolean,

    _a11yLabel: String,

    _smallScreen: Boolean,

    _snackbarOpened: Boolean,

    loadComplete: Boolean
  }}

  _propertiesChanged(props, changed, oldProps) {
    if (changed) {
      if ('categoryName' in changed) {
        this._categoryNameChanged(props.categoryName, oldProps.categoryName);
      }
      if ('page' in changed) {
        this._pageChanged(props.page, oldProps.page);
      }
      if ('offline' in changed) {
        this._offlineChanged(props.offline, oldProps.offline);
      }
      if ('meta' in changed) {
        this._metaChanged(props.meta, oldProps.meta);
      }
    }
    super._propertiesChanged(props, changed, oldProps);
  }

  constructor() {
    super();

    installRouter(() => this._updateLocation());
    installNetwork(store);
    store.dispatch(fetchCategories());
  }

  update() {
    const state = store.getState();

    this._category = currentCategorySelector(state);
    this._item = currentItemSelector(state);
    let page = pageSelector(state);
    switch (page) {
      case 'list':
        if (!this._category) page = '404';
        break;
      case 'detail':
        if (!this._item) page = '404';
        break;
      case 'home':
      case 'cart':
      case 'checkout':
        break;
      default:
        page = '404';
    }

    this.categories = Object.values(state.categories);
    this.categoryName = this._category ? this._category.name : null;
    this.meta = state.meta;
    this.modalOpened = state.modal;
    this.offline = !state.network.online;
    this.page = page;
    this._a11yLabel = state.announcer.label;
  }

  ready() {
    super.ready();
    // Custom elements polyfill safe way to indicate an element has been upgraded.
    this.removeAttribute('unresolved');
    // listen for custom events
    // this.addEventListener('add-cart-item', (e)=>this._onAddCartItem(e));
    // this.addEventListener('set-cart-item', (e)=>this._onSetCartItem(e));
    // this.addEventListener('clear-cart', (e)=>this._onClearCart(e));
    // this.addEventListener('change-section', (e)=>this._onChangeSection(e));
    // this.addEventListener('announce', (e)=>this._onAnnounce(e));
    // this.addEventListener('dom-change', (e)=>this._domChange(e));
    // this.addEventListener('show-invalid-url-warning', (e)=>this._onFallbackSelectionTriggered(e));

    const mq = window.matchMedia('(max-width: 767px)');
    mq.addListener(_ => this._smallScreen = mq.matches);
    this._smallScreen = mq.matches;
  }

  _categoryNameChanged(categoryName, oldCategoryName) {
    store.dispatch(fetchCategoryItems(this._category));

    // Reset the list view scrollTop if the category changed.
    this._listScrollTop = 0;
    scroll({ top: 0, behavior: 'silent' });
  }

  async _pageChanged(page, oldPage) {
    if (oldPage === 'list') {
      this._listScrollTop = window.pageYOffset;
    }

    // Scroll to the top of the page when navigating to a non-list page. For list view,
    // scroll to the last saved position only if the category has not changed (see
    // _categoryNameChanged).
    let scrollTop = 0;
    if (page === 'list') {
      scrollTop = this._listScrollTop;
    }
    // Use `Polymer.AppLayout.scroll` with `behavior: 'silent'` to disable header scroll
    // effects during the scroll.
    scroll({ top: scrollTop, behavior: 'silent' });

    switch (page) {
      case 'home':
        store.dispatch(updateMeta({ title: 'Home' }));
        break;
      case 'list':
        await import('../components/shop-list.js');
        store.dispatch(updateMeta({
          title: this._category.title,
          image: document.baseURI + this._category.image
        }));
        break;
      case 'detail':
        await import('../components/shop-detail.js');
        // Item is async loaded, so check if it has loaded yet. If not, meta will
        // be updated later in the receiveCategoryItems action.
        if (this._item) {
          store.dispatch(updateMeta({
            title: this._item.title,
            description: this._item.description.substring(0, 100),
            image: document.baseURI + this._item.image
          }));
        }
        break;
      case 'cart':
        await import('../components/shop-cart.js');
        store.dispatch(updateMeta({ title: 'Cart' }));
        break;
      case 'checkout':
        await import('../components/shop-checkout.js');
        store.dispatch(updateMeta({ title: 'Checkout' }));
        break;
      default:
        store.dispatch(updateMeta({ title: '404' }));
    }

    this._ensureLazyLoaded();
    if (oldPage) {
      // The size of the header depends on the page (e.g. on some pages the tabs
      // do not appear), so reset the header's layout only when switching pages.
      timeOut.run(() => {
        const header = this.shadowRoot.querySelector('#header');
        header.resetLayout();
      }, 1);
    }
  }

  _ensureLazyLoaded() {
    // load lazy resources after render and set `loadComplete` when done.
    if (!this.loadComplete) {
      afterNextRender(this, () => {
        import('./lazy-resources.js').then(() => {
          // Register service worker if supported.
          if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('service-worker.js', {scope: '/'});
          }
          this.loadComplete = true;
        });
      });
    }
  }

  _updateLocation() {
    store.dispatch(updateLocation(window.decodeURIComponent(window.location.pathname)));

    // Close the drawer - in case the *route* change came from a link in the drawer.
    this.drawerOpened = false;
  }

  _offlineChanged(offline, oldOffline) {
    // Show the snackbar if the user is offline when starting a new session
    // or if the network status changed.
    if (offline || (!offline && oldOffline === true)) {
      this._snackbarOpened = true;
      window.clearTimeout(this._snackbarTimer);
      this._snackbarTimer = window.setTimeout(() => this._snackbarOpened = false, 4000);
    }
  }

  _setMeta(attrName, attrValue, content) {
    let element = document.head.querySelector(`meta[${attrName}="${attrValue}"]`);
    if (!element) {
      element = document.createElement('meta');
      element.setAttribute(attrName, attrValue);
      document.head.appendChild(element);
    }
    element.setAttribute('content', content || '');
  }
  
  _metaChanged(detail) {
    // Announce the page's title
    if (detail.title) {
      document.title = detail.title + ' - SHOP';
      // Set open graph metadata
      this._setMeta('property', 'og:title', detail.title);
      this._setMeta('property', 'og:description', detail.description || document.title);
      this._setMeta('property', 'og:url', document.location.href);
      this._setMeta('property', 'og:image', detail.image || this.baseURI + 'images/shop-icon-128.png');
      // Set twitter card metadata
      this._setMeta('property', 'twitter:title', detail.title);
      this._setMeta('property', 'twitter:description', detail.description || document.title);
      this._setMeta('property', 'twitter:url', document.location.href);
      this._setMeta('property', 'twitter:image:src', detail.image || this.baseURI + 'images/shop-icon-128.png');
    }
  }
}

customElements.define(ShopApp.is, ShopApp);
