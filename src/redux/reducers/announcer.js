import { CLEAR_LABEL, ANNOUNCE_LABEL } from '../actions/announcer.js';

const announcer = (state = {}, action) => {
  switch (action.type) {
    case CLEAR_LABEL:
      return {
        ...state,
        label: ''
      };
    case ANNOUNCE_LABEL:
      return {
        ...state,
        label: action.label
      };
    default:
      return state;
  }
}

export default announcer;
