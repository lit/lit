import {
  UPDATE_CART_FROM_LOCAL_STORAGE,
  ADD_CART_ENTRY,
  SET_CART_ENTRY_QUANTITY,
  REMOVE_CART_ENTRY,
  CLEAR_CART
} from '../actions/cart.js';

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
