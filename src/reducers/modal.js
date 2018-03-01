/**
 * @license
 * Copyright (c) 2018 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
 */

import { CLOSE_MODAL } from '../actions/modal.js';
import { ADD_TO_CART } from '../actions/cart.js';

const modal = (state = false, action) => {
  switch (action.type) {
    case ADD_TO_CART:
      return true;
    case CLOSE_MODAL:
      return false;
    default:
      return state;
  }
}

export default modal;
