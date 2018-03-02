/**
 * @license
 * Copyright (c) 2018 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
 */

// TODO: See below where imports are used.
// import { fetchCategoryItems } from './categories.js';
// import { currentCategorySelector } from '../reducers/categories.js';

export const SET_ANNOUNCER_LABEL = 'SET_ANNOUNCER_LABEL';
export const CLEAR_ANNOUNCER_LABEL = 'CLEAR_ANNOUNCER_LABEL';
export const CLOSE_MODAL = 'CLOSE_MODAL';
export const UPDATE_NETWORK_STATUS = 'UPDATE_NETWORK_STATUS';
export const CLOSE_SNACKBAR = 'CLOSE_SNACKBAR';

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
