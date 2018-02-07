/**
 * @license
 * Copyright (c) 2018 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
 */

import {
  UPDATE_CART_FROM_LOCAL_STORAGE,
  ADD_CART_ENTRY,
  SET_CART_ENTRY_QUANTITY,
  REMOVE_CART_ENTRY,
  CLEAR_CART
} from '../actions/cart.js';
import { createSelector } from '../../../node_modules/reselect/es/index.js';

const cart = (state = {}, action) => {
  switch (action.type) {
    case UPDATE_CART_FROM_LOCAL_STORAGE:
      return {
        ...action.cart
      };
    case ADD_CART_ENTRY:
    case SET_CART_ENTRY_QUANTITY:
      return {
        ...state,
        [action.entryId]: entry(state[action.entryId], action)
      };
    case REMOVE_CART_ENTRY:
      const result = {...state};
      delete result[action.entryId];
      return result;
    case CLEAR_CART:
      return {};
    default:
      return state;
  }
}

const entry = (state = {}, action) => {
  switch (action.type) {
    case ADD_CART_ENTRY:
      return {
        ...action.entry,
        quantity: (state.quantity || 0) + action.entry.quantity
      };
    case SET_CART_ENTRY_QUANTITY:
      return {
        ...action.entry
      };
    default:
      return state;
  }
}

export default cart;

const cartSelector = state => state.cart;

export const numItemsSelector = createSelector(
  cartSelector,
  cart => {
    if (cart) {
      return Object.values(cart).reduce((total, entry) => {
        return total + entry.quantity;
      }, 0);
    }
  
    return 0;
  }
)

export const totalSelector = createSelector(
  cartSelector,
  cart => {
    if (cart) {
      return Object.values(cart).reduce((total, entry) => {
        return total + entry.quantity * entry.item.price;
      }, 0);
    }
  
    return 0;
  }
)
