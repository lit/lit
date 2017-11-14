import { UPDATE_NETWORK_FAILURE, UPDATE_NETWORK_STATUS } from '../actions/network.js';
import { RECEIVE_ITEMS } from '../actions/categories.js';

const network = (state = {}, action) => {
  switch (action.type) {
    case UPDATE_NETWORK_FAILURE:
      return {
        ...state,
        failure: action.failure
      };
    case RECEIVE_ITEMS:
      return {
        ...state,
        failure: false
      };
    case UPDATE_NETWORK_STATUS:
      return {
        ...state,
        online: action.online
      };
    default:
      return state;
  }
}

export default network;
