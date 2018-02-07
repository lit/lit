/**
 * @license
 * Copyright (c) 2018 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
 */

import { fetchCategoryItems } from './categories.js';
import { currentCategorySelector } from '../reducers/categories.js';

export const UPDATE_NETWORK_STATUS = 'UPDATE_NETWORK_STATUS';

export const updateNetworkStatus = (online) => (dispatch, getState) => {
  dispatch({
    type: UPDATE_NETWORK_STATUS,
    online
  });
  if (online) {
    dispatch(fetchCategoryItems(currentCategorySelector(getState())));
  }
};
