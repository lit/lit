import { RESET_CHECKOUT, UPDATE_CHECKOUT_STATE } from '../actions/checkout.js';

const location = (state = {}, action) => {
  switch (action.type) {
    case RESET_CHECKOUT:
      return {
        ...state,
        state: 'init'
      };
    case UPDATE_CHECKOUT_STATE:
      return {
        ...state,
        state: action.state
      };
    default:
      return state;
  }
}

export default location;
