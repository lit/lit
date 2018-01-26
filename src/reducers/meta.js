import { UPDATE_META } from '../actions/meta.js';

const meta = (state = {}, action) => {
  switch (action.type) {
    case UPDATE_META:
      return {
        ...action.detail
      };
    default:
      return state;
  }
}

export default meta;
