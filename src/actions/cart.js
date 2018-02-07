/**
 * @license
 * Copyright (c) 2018 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
 */

import { announceLabel } from './announcer.js';

export const UPDATE_CART_FROM_LOCAL_STORAGE = 'UPDATE_CART_FROM_LOCAL_STORAGE';
export const ADD_CART_ENTRY = 'ADD_CART_ENTRY';
export const SET_CART_ENTRY_QUANTITY = 'SET_CART_ENTRY_QUANTITY';
export const REMOVE_CART_ENTRY = 'REMOVE_CART_ENTRY';
export const CLEAR_CART = 'CLEAR_CART';

export const updateCartFromLocalStorage = (cart) => {
  return {
    type: UPDATE_CART_FROM_LOCAL_STORAGE,
    cart
  };
};

export const addCartEntry = (entry) => (dispatch) => {
  dispatch({
    type: ADD_CART_ENTRY,
    entryId: getEntryId(entry),
    entry
  });
  dispatch(announceLabel('Item added to your cart'));
};

export const setCartEntryQuantity = (entry) => (dispatch) => {
  dispatch({
    type: SET_CART_ENTRY_QUANTITY,
    entryId: getEntryId(entry),
    entry
  });
  dispatch(announceLabel(`Quantity changed to ${entry.quantity}`));
};

export const removeCartEntry = (entry) => (dispatch) => {
  dispatch({
    type: REMOVE_CART_ENTRY,
    entryId: getEntryId(entry),
    entry
  });
  dispatch(announceLabel(`Item removed from your cart`));
};

export const clearCart = () => {
  return {
    type: CLEAR_CART
  };
};

function getEntryId(entry) {
  return `${entry.item.category}_$$$_${entry.item.name}_$$$_${entry.size}`;
}
