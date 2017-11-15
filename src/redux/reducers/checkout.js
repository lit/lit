import { UPDATE_CHECKOUT_STATE } from '../actions/checkout.js';
import { UPDATE_LOCATION } from '../actions/location.js';

const checkout = (state = {}, action) => {
  switch (action.type) {
    case UPDATE_LOCATION:
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

export default checkout;
