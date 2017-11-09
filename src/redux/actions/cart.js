import { getEntryId } from '../helpers/cart.js';

export const UPDATE_CART = 'UPDATE_CART';
export const ADD_CART_ENTRY = 'ADD_CART_ENTRY';
export const SET_CART_ENTRY = 'SET_CART_ENTRY';
export const CLEAR_CART = 'CLEAR_CART';

export const updateCart = (cart) => {
  return {
    type: UPDATE_CART,
    cart
  };
};

export const addCartEntry = (entry) => {
  return {
    type: ADD_CART_ENTRY,
    entryId: getEntryId(entry.item.category, entry.item.name, entry.size),
    entry
  };
};

export const setCartEntry = (entry) => {
  return {
    type: SET_CART_ENTRY,
    entryId: getEntryId(entry.item.category, entry.item.name, entry.size),
    entry
  };
};

export const clearCart = () => {
  return {
    type: CLEAR_CART
  };
};
