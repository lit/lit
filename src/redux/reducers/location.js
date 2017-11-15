import { UPDATE_LOCATION } from '../actions/location.js';
import { createSelector } from '../../../node_modules/reselect/es/index.js';

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

const pathSelector = state => state.location.path;

export const splitPathSelector = createSelector(
  pathSelector,
  path => {
    return path.slice(1).split('/') || [];
  }
);

export const pageSelector = createSelector(
  splitPathSelector,
  splitPath => {
    return splitPath[0] || 'home';
  }
);
