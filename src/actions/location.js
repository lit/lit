/**
 * @license
 * Copyright (c) 2018 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
 */

import { pageSelector } from '../reducers/location.js';
import { currentCategorySelector, currentItemSelector } from '../reducers/categories.js';
import { fetchCategoryItems, fetchCategories } from '../actions/categories.js';
import { updateMeta } from '../actions/meta.js';

export const UPDATE_LOCATION = 'UPDATE_LOCATION';
export const RECEIVE_LAZY_RESOURCES = 'RECEIVE_LAZY_RESOURCES';
export const SET_PATH_IS_VALID = 'SET_PATH_IS_VALID';
export const SET_PATH_IS_INVALID = 'SET_PATH_IS_INVALID';

export const updateLocation = (path) => (dispatch, getState) => {
  dispatch({
    type: UPDATE_LOCATION,
    path
  });

  const state = getState();

  const category = currentCategorySelector(state);
  const item = currentItemSelector(state);
  let page = pageSelector(state);

  switch (page) {
    case 'list':
      if (!category) page = '404';
      break;
    case 'detail':
      if (!category || !item) page = '404';
      break;
    case 'home':
    case 'cart':
    case 'checkout':
      break;
    default:
      page = '404';
  }

  dispatch(loadPage(page, category, item));
};

const loadPage = (page, category, item) => async (dispatch) => {
  switch (page) {
    case 'home':
      dispatch(updateMeta({ title: 'Home' }));
      break;
    case 'list':
      await import('../components/shop-list.js');
      if (category) {
        dispatch(fetchCategoryItems(category));
        dispatch(updateMeta({
          title: category.title,
          image: document.baseURI + category.image
        }));
      }
      break;
    case 'detail':
      await import('../components/shop-detail.js');
      if (item && item.title) {
        dispatch(updateMeta({
          title: item.title,
          description: item.description.substring(0, 100),
          image: document.baseURI + item.image
        }));
      }
      break;
    case 'cart':
      await import('../components/shop-cart.js');
      dispatch(updateMeta({ title: 'Cart' }));
      break;
    case 'checkout':
      await import('../components/shop-checkout.js');
      dispatch(updateMeta({ title: 'Checkout' }));
      break;
    default:
      dispatch(updateMeta({ title: '404' }));
  }

  if (page === '404') {
    dispatch(setPathIsInvalid());
  } else {
    dispatch(setPathIsValid());
  }

  dispatch(ensureLazyLoaded());
};

let lazyLoadComplete;

const ensureLazyLoaded = () => (dispatch) => {
  // load lazy resources after render and set `lazyLoadComplete` when done.
  if (!lazyLoadComplete) {
    requestAnimationFrame(() => {
      import('../components/lazy-resources.js').then(() => {
        // Register service worker if supported.
        if ('serviceWorker' in navigator) {
          navigator.serviceWorker.register('service-worker.js', {scope: '/'});
        }
        lazyLoadComplete = true;
        dispatch({
          type: RECEIVE_LAZY_RESOURCES
        })
      });
    });
  }
};

export const setPathIsValid = () => {
  return {
    type: SET_PATH_IS_VALID
  };
}

export const setPathIsInvalid = () => {
  return {
    type: SET_PATH_IS_INVALID
  };
}
