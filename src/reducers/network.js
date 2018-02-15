/**
 * @license
 * Copyright (c) 2018 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
 */

import { UPDATE_NETWORK_STATUS, OPEN_SNACKBAR, CLOSE_SNACKBAR } from '../actions/network.js';

const network = (state = {}, action) => {
  switch (action.type) {
    case UPDATE_NETWORK_STATUS:
      return {
        ...state,
        online: action.online
      };
    case OPEN_SNACKBAR:
      return {
        ...state,
        snackbarOpened: true
      }
    case CLOSE_SNACKBAR:
      return {
        ...state,
        snackbarOpened: false
      }
    default:
      return state;
  }
}

export default network;
