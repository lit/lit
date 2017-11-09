import { UPDATE_CART, ADD_CART_ENTRY, SET_CART_ENTRY } from '../actions/cart.js';

const cart = (state = {}, action) => {
  switch (action.type) {
    case UPDATE_CART:
      return {
        ...action.cart
      };
    case ADD_CART_ENTRY:
    case SET_CART_ENTRY:
      return {
        ...state,
        [action.entryId]: entry(state[action.entryId], action)
      };
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
    case SET_CART_ENTRY:
      return {
        ...action.entry
      };
    default:
      return state;
  }
}

export default cart;
