/**
 * @license
 * Copyright (c) 2018 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
 */

import { LitElement, html } from '@polymer/lit-element';
import { repeat } from 'lit-html/lib/repeat.js';
import '@polymer/app-layout/app-header/app-header.js';
import '@polymer/app-layout/app-scroll-effects/effects/waterfall.js';
import '@polymer/app-layout/app-toolbar/app-toolbar.js';
import { scroll } from '@polymer/app-layout/helpers/helpers.js';
import { setPassiveTouchGestures } from '@polymer/polymer/lib/utils/settings.js';

import { connect } from 'pwa-helpers/connect-mixin.js';
import { installRouter } from 'pwa-helpers/router.js';
import { updateMetadata } from 'pwa-helpers/metadata.js';
import { installOfflineWatcher } from 'pwa-helpers/network.js';
import { installMediaQueryWatcher } from 'pwa-helpers/media-query.js';

import { store } from '../store.js';
import { currentCategorySelector } from '../reducers/categories.js';
import { metaSelector } from '../reducers/app.js';
import { updateLocation, updateNetworkStatus } from '../actions/app.js';

import './shop-home.js';

class ShopApp extends connect(store)(LitElement) {
  _render({
    _categories,
    _categoryName,
    _lazyResourcesLoaded,
    _modalOpened,
    _offline,
    _snackbarOpened,
    _page,
    _a11yLabel,
    _drawerOpened,
    _smallScreen }) {

    const categoriesList = Object.keys(_categories).map(key => _categories[key]);

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
        margin: 20px 0;
      }

      .drawer-list a {
        display: block;
        padding: 0 16px;
        line-height: 40px;
        text-decoration: none;
        color: var(--app-secondary-color);
      }

      .drawer-list a.active {
        color: black;
        font-weight: bold;
      }

      shop-cart-modal {
        z-index: 2;
      }

      app-drawer {
        z-index: 3;
      }

      main {
        max-width: 1440px;
        margin: 0 auto;
      }

      main > * {
        display: none;
      }

      main > [active] {
        display: block;
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

    <app-header role="navigation" id="header" effects="waterfall" condenses reveals>
      <app-toolbar>
        <div class="left-bar-item">
          <paper-icon-button class="menu-btn" icon="menu"
              on-click="${_ => this._drawerOpened = true}"
              aria-label="Categories"
              hidden="${!_smallScreen || _page === 'detail'}">
          </paper-icon-button>
          <a class="back-btn" href="/list/${_categoryName}" tabindex="-1"
              hidden="${_page !== 'detail'}">
            <paper-icon-button icon="arrow-back" aria-label="Go back"></paper-icon-button>
          </a>
        </div>
        <div class="logo" main-title><a href="/" aria-label="SHOP Home">SHOP</a></div>
        <shop-cart-button></shop-cart-button>
      </app-toolbar>

      <!-- Lazy-create the tabs for larger screen sizes. -->
      ${ ['home', 'list', 'detail'].indexOf(_page) !== -1 && !_smallScreen && _lazyResourcesLoaded ?
        html`
          <div id="tabContainer" sticky>
            <shop-tabs selectedIndex="${Object.keys(_categories).indexOf(_categoryName)}">
              ${repeat(categoriesList, category => html`
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
    ${ _smallScreen && _lazyResourcesLoaded ?
      html`
        <app-drawer opened="${_drawerOpened}" tabindex="0" on-opened-changed="${e => this._drawerOpened = e.target.opened}">
          <nav class="drawer-list">
            ${repeat(categoriesList, category => html`
              <a class$="${category.name === _categoryName ? 'active' : ''}" href="/list/${category.name}">${category.title}</a>
            `)}
          </nav>
        </app-drawer>
      ` : null
    }

    <main>
      <!-- home view -->
      <shop-home active?="${_page === 'home'}"></shop-home>
      <!-- list view of items in a category -->
      <shop-list active?="${_page === 'list'}"></shop-list>
      <!-- detail view of one item -->
      <shop-detail active?="${_page === 'detail'}"></shop-detail>
      <!-- cart view -->
      <shop-cart active?="${_page === 'cart'}"></shop-cart>
      <!-- checkout view -->
      <shop-checkout active?="${_page === 'checkout'}"></shop-checkout>

      <shop-404-warning active?="${_page === '404'}"></shop-404-warning>
    </main>

    <footer>
      <a href="https://www.polymer-project.org/1.0/toolbox/">Made by Polymer</a>
      <div class="demo-label">Demo Only</div>
    </footer>

    <!-- a11y announcer -->
    <div class="announcer" aria-live="assertive">${_a11yLabel}</div>

    ${ _modalOpened ? html`<shop-cart-modal></shop-cart-modal>` : null }
    ${ _lazyResourcesLoaded ? html`
      <shop-snackbar class$="${_snackbarOpened ? 'opened' : ''}">
        ${_offline ? 'You are offline' : 'You are online'}
      </shop-snackbar>
      ` : null
    }
    `;
  }

  static get properties() { return {
    _page: String,

    _offline: Boolean,

    _snackbarOpened: Boolean,

    _meta: Object,

    _modalOpened: Object,

    _categories: Object,

    _categoryName: String,

    _a11yLabel: String,

    _lazyResourcesLoaded: Boolean,

    _drawerOpened: Boolean,

    _smallScreen: Boolean,
  }}

  _didRender(props, changed, oldProps) {
    if ('_page' in changed || '_categoryName' in changed) {
      // TODO: For list view, scroll to the last saved position only if the category has not changed
      scroll({ top: 0, behavior: 'silent' });
    }
    if ('_page' in changed) {
      // TODO: Remove this when app-header updated to use ResizeObserver so we can avoid this bit.
      // The size of the header depends on the page (e.g. on some pages the tabs
      // do not appear), so reset the header's layout when switching pages.
      const header = this.shadowRoot.querySelector('#header');
      header.resetLayout();
    }
    if ('_meta' in changed) {
      const meta = props._meta;
      if (meta) {
        updateMetadata({
          title: meta.title,
          description: meta.description || meta.title,
          image: meta.image || this.baseURI + 'images/shop-icon-128.png'
        });
      }
    }
  }

  constructor() {
    super();
    // To force all event listeners for gestures to be passive.
    // See https://www.polymer-project.org/2.0/docs/devguide/gesture-events#use-passive-gesture-listeners
    setPassiveTouchGestures(true);
  }

  _firstRendered() {
    installRouter((location) => this._updateLocation(location));
    installOfflineWatcher((offline) => store.dispatch(updateNetworkStatus(offline)));
    installMediaQueryWatcher('(max-width: 767px)', (matches) => this._smallScreen = matches);

    // Custom elements polyfill safe way to indicate an element has been upgraded.
    this.removeAttribute('unresolved');
  }

  _stateChanged(state) {
    const category = currentCategorySelector(state);
    this._page = state.app.page;
    this._categories = state.categories;
    this._categoryName = state.app.categoryName;
    this._meta = metaSelector(state);
    this._modalOpened = state.app.cartModalOpened;
    this._lazyResourcesLoaded = state.app.lazyResourcesLoaded;
    this._a11yLabel = state.app.announcerLabel;
    this._offline = state.app.offline;
    this._snackbarOpened = state.app.snackbarOpened;
  }

  _updateLocation(location) {
    store.dispatch(updateLocation(location));

    // Close the drawer - in case the *route* change came from a link in the drawer.
    this._drawerOpened = false;
  }
}

customElements.define('shop-app', ShopApp);
