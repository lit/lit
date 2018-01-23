import { COMPLETE_LOAD } from '../actions/load.js';

const load = (state = {}, action) => {
  switch (action.type) {
    case COMPLETE_LOAD:
      return {
        ...state,
        complete: true
      };
    default:
      return state;
  }
}

export default load;
