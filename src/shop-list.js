import { Element } from '../node_modules/@polymer/polymer/polymer-element.js';
import '../node_modules/@polymer/iron-flex-layout/iron-flex-layout.js';
import './shop-common-styles.js';
import './shop-image.js';
import './shop-list-item.js';
import { Debouncer } from '../node_modules/@polymer/polymer/lib/utils/debounce.js';
import { microTask } from '../node_modules/@polymer/polymer/lib/utils/async.js';

import { store } from './redux/index.js';
import { getLocationPathPart } from './redux/helpers/location.js';
import { updateMeta } from './redux/actions/meta.js';

class ShopList extends Element {
  static get template() {
    return `
    <style include="shop-common-styles">

      .hero-image {
        position: relative;
        height: 320px;
        overflow: hidden;
        margin-bottom: 32px;
      }

      .hero-image {
        --shop-image-img: {
          position: absolute;
          top: 0;
          bottom: 0;
          left: -9999px;
          right: -9999px;
          max-width: none;
        };
      }

      .grid {
        @apply --layout-horizontal;
        @apply --layout-wrap;
        @apply --layout-justified;
        margin: 0 10px 32px 10px;
        padding: 0;
        list-style: none;
      }

      .grid li {
        -webkit-flex: 1 1;
        flex: 1 1;
        -webkit-flex-basis: 33%;
        flex-basis: 33%;
        max-width: 33%;
      }

      .grid a {
        display:block;
        text-decoration: none;
      }

      @media (max-width: 767px) {
        .hero-image {
          display: none;
        }

        .grid  li {
          -webkit-flex-basis: 50%;
          flex-basis: 50%;
          max-width: 50%;
        }
      }

    </style>

    <shop-image
        alt="[[category.title]]"
        src="[[category.image]]"
        placeholder-img="[[category.placeholder]]" class="hero-image"></shop-image>

    <header>
      <h1>[[category.title]]</h1>
      <span>[[_getPluralizedQuantity(category.items)]]</span>
    </header>

    <ul class="grid" hidden$="[[failure]]">
      <dom-repeat items="[[_getListItems(category.items)]]" initial-count="4">
        <template>
          <li>
            <a href$="[[_getItemHref(item)]]"><shop-list-item item="[[item]]"></shop-list-item></a>
          </li>
        </template>
      </dom-repeat>
    </ul>

    <!--
      shop-network-warning shows a warning message when the items can't be rendered due
      to network conditions.
    -->
    <shop-network-warning hidden$="[[!failure]]"></shop-network-warning>

  </template>
  `;
}

  static get is() { return 'shop-list'; }

  static get properties() { return {

    category: Object,

    visible: {
      type: Boolean,
      value: false
    },

    failure: Boolean

  }}

  static get observers() { return [
    '_categoryChanged(category, visible)'
  ]}
  
  constructor() {
    super();

    store.subscribe(() => this.update());
    this.update();
  }

  update() {
    const state = store.getState();
    this.setProperties({
      category: state.categories[getLocationPathPart(state, 1)],
      failure: state.network.failure
    });
  }

  connectedCallback() {
    super.connectedCallback();
    this.isAttached = true;
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.isAttached = false;
  }

  _getListItems(items) {
    // Return placeholder items when the items haven't loaded yet.
    return items ? Object.values(items) : [{},{},{},{},{},{},{},{},{},{}];
  }

  _getItemHref(item) {
    // By returning null when `itemId` is undefined, the href attribute won't be set and
    // the link will be disabled.
    return item.name ? ['/detail', this.category.name, item.name].join('/') : null;
  }

  _getPluralizedQuantity(items) {
    const quantity = items ? Object.keys(items).length : 0;
    if (!quantity) {
      return '';
    }
    let pluralizedQ = quantity === 1 ? 'item' : 'items';
    return  '(' + quantity + ' ' + pluralizedQ + ')';
  }

  _categoryChanged(category, visible) {
    if (!visible) {
      return;
    }
    this._changeSectionDebouncer = Debouncer.debounce(this._changeSectionDebouncer,
      microTask, () => {
        if (category) {
          // Notify the category and the page's title
          // store.dispatch(updateMeta({
          //   category: category.name,
          //   title: category.title,
          //   image: this.baseURI + category.image
          // }));
        }
      });
  }

}

customElements.define(ShopList.is, ShopList);
