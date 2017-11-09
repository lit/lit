import { UPDATE_NETWORK_FAILURE, UPDATE_NETWORK_STATUS } from '../actions/network.js';

const network = (state = {}, action) => {
  switch (action.type) {
    case UPDATE_NETWORK_FAILURE:
      return {
        ...state,
        failure: action.failure
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
