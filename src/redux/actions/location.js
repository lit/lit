import { getCategoryItems } from './categories.js';

export const UPDATE_LOCATION = 'UPDATE_LOCATION';

export const updateLocation = (path) => (dispatch) => {
  dispatch({
    type: UPDATE_LOCATION,
    path
  });
  dispatch(getCategoryItems());
}
