import { getEntryId } from '../helpers/cart.js';
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
    entryId: getEntryId(entry.item.category, entry.item.name, entry.size),
    entry
  });
  dispatch(announceLabel('Item added to your cart'));
};

export const setCartEntryQuantity = (entry) => (dispatch) => {
  dispatch({
    type: SET_CART_ENTRY_QUANTITY,
    entryId: getEntryId(entry.item.category, entry.item.name, entry.size),
    entry
  });
  dispatch(announceLabel(`Quantity changed to ${entry.quantity}`));
};

export const removeCartEntry = (entry) => (dispatch) => {
  dispatch({
    type: REMOVE_CART_ENTRY,
    entryId: getEntryId(entry.item.category, entry.item.name, entry.size),
    entry
  });
  dispatch(announceLabel(`Item removed from your cart`));
};

export const clearCart = () => {
  return {
    type: CLEAR_CART
  };
};
