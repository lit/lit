import { CLOSE_MODAL } from '../actions/modal.js';
import { ADD_CART_ENTRY } from '../actions/cart.js';

const modal = (state = false, action) => {
  switch (action.type) {
    case ADD_CART_ENTRY:
      return true;
    case CLOSE_MODAL:
      return false;
    default:
      return state;
  }
}

export default modal;
