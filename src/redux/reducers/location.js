import { UPDATE_LOCATION } from '../actions/location.js';

const location = (state = {}, action) => {
  switch (action.type) {
    case UPDATE_LOCATION:
      return {
        ...state,
        path: action.path
      };
    default:
      return state;
  }
}

export default location;
