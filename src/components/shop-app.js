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
import { Debouncer } from '../../node_modules/@polymer/polymer/lib/utils/debounce.js';

import { store } from '../store.js';
import { splitPathSelector } from '../reducers/location.js';

// performance logging
window.performance && performance.mark && performance.mark('shop-app - before register');

class ShopApp extends LitElement {
  render({ categories, categoryName, drawerOpened, modalOpened, page, _a11yLabel, _loadComplete, _smallScreen }) {
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

      .menu-btn {
        display: none;
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

      :host(:not([page=detail])) .back-btn {
        display: none;
      }

      [hidden] {
        display: none !important;
      }

      #tabContainer {
        position: relative;
        height: 66px;
      }

      shop-tabs, shop-tab {
        /*--shop-tab-overlay: {
          border-bottom: 2px solid var(--app-accent-color);
        };*/
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

        .menu-btn {
          display: block;
        }

        :host([page=detail]) .menu-btn {
          display: none;
        }
      }

    </style>

    <shop-analytics key="UA-39334307-16"></shop-analytics>

    <app-header role="navigation" id="header" effects="waterfall" condenses="" reveals="">
      <app-toolbar>
        <div class="left-bar-item">
          <paper-icon-button class="menu-btn" icon="menu" on-click="${_ => this.drawerOpened = true}" aria-label="Categories">
          </paper-icon-button>
          <a class="back-btn" href="/list/${categoryName}" tabindex="-1">
            <paper-icon-button icon="arrow-back" aria-label="Go back"></paper-icon-button>
          </a>
        </div>
        <div class="logo" main-title=""><a href="/" aria-label="SHOP Home">SHOP</a></div>
        <shop-cart-button></shop-cart-button>
      </app-toolbar>

      <!-- Lazy-create the tabs for larger screen sizes. -->
      ${ ['home', 'list', 'detail'].indexOf(page) !== -1 && !_smallScreen && _loadComplete ?
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
    ${ _smallScreen && _loadComplete ?
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

    <shop-cart-modal></shop-cart-modal>
    ${ modalOpened ? html`<shop-cart-modal></shop-cart-modal>` : null }
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

    _loadComplete: Boolean
  }}

  constructor() {
    super();
    window.performance && performance.mark && performance.mark('shop-app.created');

    store.subscribe(() => this.update());
    this.update();
  }

  update() {
    const state = store.getState();
    let page = splitPathSelector(state)[0] || 'home';
    let categoryName = null;
    if (['list', 'detail'].indexOf(page) !== -1) {
      categoryName = splitPathSelector(state)[1];
      if (Object.keys(state.categories).indexOf(categoryName) === -1) {
        page = '404';
      }
    } else if (['home', 'cart', 'checkout'].indexOf(page) === -1) {
      page = '404';
    }

    if (this.page !== page) {
      const oldPage = this.page;
      this._pageChanged(this.page = page, oldPage);
    }

    if (this.offline === state.network.online) {
      const oldOffline = this.offline;
      this._offlineChanged(this.offline = !state.network.online, oldOffline);
    }

    if (this.meta !== state.meta) {
      const oldMeta = this.meta;
      this._metaChanged(this.meta = state.meta, oldMeta);
    }

    this.categories = Object.values(state.categories);
    this.categoryName = categoryName;
    this.modalOpened = state.modal;
    this._a11yLabel = state.announcer.label;
    this._loadComplete = state.load && state.load.complete;
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

  _pageChanged(page, oldPage) {
    // TODO: With new redux model, _listScrollTop isn't getting set before page change.
    // if (page === 'list') {
    //   this._listScrollTop = window.pageYOffset;
    // }

    // Close the drawer - in case the *route* change came from a link in the drawer.
    this.drawerOpened = false;

    // if (page != null) {
    //   // home route is eagerly loaded
    //   if (page == 'home') {
    //     this._pageLoaded(Boolean(oldPage));
    //   // other routes are lazy loaded
    //   } else {
    //     // When a load failed, it triggered a 404 which means we need to
    //     // eagerly load the 404 page definition
    //     let cb = this._pageLoaded.bind(this, Boolean(oldPage));
    //     switch (page) {
    //       case 'list':
    //         import('./shop-list.js').then(cb);
    //         break;
    //       case 'detail':
    //         import('./shop-detail.js').then(cb);
    //         break;
    //       case 'cart':
    //         import('./shop-cart.js').then(cb);
    //         break;
    //       case 'checkout':
    //         import('./shop-checkout.js').then(cb);
    //         break;
    //     }
    //   }
    // }
  }

  _pageLoaded(shouldResetLayout) {
    this._ensureLazyLoaded();
    if (shouldResetLayout) {
      // The size of the header depends on the page (e.g. on some pages the tabs
      // do not appear), so reset the header's layout only when switching pages.
      timeOut.run(() => {
        this.$.header.resetLayout();
      }, 1);
    }
  }

  _ensureLazyLoaded() {
    // load lazy resources after render and set `_loadComplete` when done.
    if (!this._loadComplete) {
      afterNextRender(this, () => {
        import('./lazy-resources.js').then(() => {
          // Register service worker if supported.
          if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('service-worker.js', {scope: '/'});
          }
          this._loadComplete = true;
        });
      });
    }
  }

  _offlineChanged(offline, oldOffline) {
    // Show the snackbar if the user is offline when starting a new session
    // or if the network status changed.
    if (offline || (!offline && oldOffline === true)) {
      if (!this._networkSnackbar) {
        this._networkSnackbar = document.createElement('shop-snackbar');
        this.root.appendChild(this._networkSnackbar);
      }
      this._networkSnackbar.innerHTML = offline ?
          'You are offline' : 'You are online';
      this._networkSnackbar.open();
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

  // Elements in the app can notify section changes.
  // Response by a11y announcing the section and syncronizing the category.
  // _onChangeSection(event) {
  //   let detail = event.detail;

    // TODO: With new redux model, _listScrollTop isn't getting set before page change.
    // // Scroll to the top of the page when navigating to a non-list page. For list view,
    // // scroll to the last saved position only if the category has not changed.
    // let scrollTop = 0;
    // if (this.page === 'list') {
    //   if (this.categoryName === detail.category) {
    //     scrollTop = this._listScrollTop;
    //   } else {
    //     // Reset the list view scrollTop if the category changed.
    //     this._listScrollTop = 0;
    //   }
    // }
    // // Use `Polymer.AppLayout.scroll` with `behavior: 'silent'` to disable header scroll
    // // effects during the scroll.
    // scroll({ top: scrollTop, behavior: 'silent' });
  
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

  // This is for performance logging only.
  _domChange(e) {
    if (window.performance && performance.mark && !this.__loggedDomChange) {
      let target = e.composedPath()[0];
      let host = target.getRootNode().host;
      if (host && host.localName.match(this.page)) {
        this.__loggedDomChange = true;
        performance.mark(host.localName + '.domChange');
      }
    }
  }
}

customElements.define(ShopApp.is, ShopApp);
