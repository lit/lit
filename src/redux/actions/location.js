import { fetchCategoryItems } from './categories.js';
import { currentCategorySelector } from '../reducers/categories.js';

export const UPDATE_LOCATION = 'UPDATE_LOCATION';

export const updateLocation = (path) => (dispatch, getState) => {
  dispatch({
    type: UPDATE_LOCATION,
    path
  });
  dispatch(fetchCategoryItems(currentCategorySelector(getState())));
};

export const pushState = (href) => (dispatch) => {
  window.history.pushState({}, '', href);
  dispatch(updateLocation(window.decodeURIComponent(window.location.pathname)));
};
