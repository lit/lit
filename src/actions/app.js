/**
 * @license
 * Copyright (c) 2018 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
 */

import { fetchCategoryItemsIfNeeded, fetchCategoriesIfNeeded } from './categories.js';
import { currentCategorySelector, currentItemSelector } from '../reducers/categories.js';

export const UPDATE_LOCATION = 'UPDATE_LOCATION';
export const RECEIVE_LAZY_RESOURCES = 'RECEIVE_LAZY_RESOURCES';
export const SET_ANNOUNCER_LABEL = 'SET_ANNOUNCER_LABEL';
export const CLEAR_ANNOUNCER_LABEL = 'CLEAR_ANNOUNCER_LABEL';
export const CLOSE_MODAL = 'CLOSE_MODAL';
export const UPDATE_NETWORK_STATUS = 'UPDATE_NETWORK_STATUS';
export const CLOSE_SNACKBAR = 'CLOSE_SNACKBAR';

export const updateLocation = (path) => async (dispatch, getState) => {
  const splitPath = (path || '').slice(1).split('/');
  let page = '404';
  let categoryName = null;
  let itemName = null;
  await dispatch(fetchCategoriesIfNeeded());
  switch (splitPath[0]) {
    case '':
      page = 'home';
      dispatch(announceLabel(`Home, loaded`));
      break;
    case 'cart':
      page = 'cart';
      await import('../components/shop-cart.js');
      dispatch(announceLabel(`Cart, loaded`));
      break;
    case 'checkout':
      page = 'checkout';
      await import('../components/shop-checkout.js');
      dispatch(announceLabel(`Checkout, loaded`));
      break;
    default:
      categoryName = splitPath[1];
      let category = getState().categories[categoryName];
      if (category) {
        await dispatch(fetchCategoryItemsIfNeeded(category));
        category = getState().categories[categoryName];
        switch (splitPath[0]) {
          case 'list':
            page = 'list';
            await import('../components/shop-list.js');
            dispatch(announceLabel(`${category.title}, loaded`));
            break;
          case 'detail':
            itemName = splitPath[2];
            const item = category.items[itemName];
            if (item) {
              page = 'detail';
              await import('../components/shop-detail.js');
              dispatch(announceLabel(`${item.title}, loaded`));
            }
            break;
        }
      }
  }

  if (page === '404') {
    dispatch(announceLabel(`Page not found`));
  }

  dispatch({
    type: UPDATE_LOCATION,
    page,
    categoryName,
    itemName
  });

  const lazyLoadComplete = getState().app.lazyResourcesLoaded;
  // load lazy resources after render and set `lazyLoadComplete` when done.
  if (!lazyLoadComplete) {
    requestAnimationFrame(async () => {
      await import('../components/lazy-resources.js');
      dispatch({
        type: RECEIVE_LAZY_RESOURCES
      });
    });
  }
};

const setAnnouncerLabel = (label) => {
  return {
    type: SET_ANNOUNCER_LABEL,
    label
  };
};

const clearAnnouncerLabel = () => {
  return {
    type: CLEAR_ANNOUNCER_LABEL
  };
};

let announcerTimer = 0;

export const announceLabel = (label) => (dispatch) => {
  dispatch(clearAnnouncerLabel());
  // Debounce announcements.
  clearTimeout(announcerTimer);
  announcerTimer = setTimeout(() => {
    dispatch(setAnnouncerLabel(label));
  }, 300);
};

export const closeModal = () => {
  return {
    type: CLOSE_MODAL
  };
};

let snackbarTimer = 0;

export const updateNetworkStatus = (offline) => (dispatch, getState) => {
  dispatch({
    type: UPDATE_NETWORK_STATUS,
    offline
  });
  clearTimeout(snackbarTimer);
  snackbarTimer = setTimeout(() => dispatch({ type: CLOSE_SNACKBAR }), 3000);

  // TODO: This is intended to automatically fetch when you come back online. Currently
  // disabled because it is causing double requests on initial load of the list page.
  // if (!offline) {
  //   dispatch(fetchCategoryItems(currentCategorySelector(getState())));
  // }
};
