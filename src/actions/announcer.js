/**
 * @license
 * Copyright (c) 2018 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
 */

export const SET_ANNOUNCER_LABEL = 'SET_ANNOUNCER_LABEL';
export const CLEAR_ANNOUNCER_LABEL = 'CLEAR_ANNOUNCER_LABEL';

let timer = 0;

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

export const announceLabel = (label) => (dispatch) => {
  dispatch(clearAnnouncerLabel());
  // Debounce announcements.
  clearTimeout(timer);
  timer = setTimeout(() => {
    dispatch(setAnnouncerLabel(label));
  }, 300);
};
