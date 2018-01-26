import { CLEAR_ANNOUNCER_LABEL, SET_ANNOUNCER_LABEL } from '../actions/announcer.js';

const announcer = (state = {}, action) => {
  switch (action.type) {
    case CLEAR_ANNOUNCER_LABEL:
      return {
        ...state,
        label: ''
      };
    case SET_ANNOUNCER_LABEL:
      return {
        ...state,
        label: action.label
      };
    default:
      return state;
  }
}

export default announcer;
