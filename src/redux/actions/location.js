import { getCategoryItems } from './categories.js';
import { resetCheckout } from './checkout.js';

export const UPDATE_LOCATION = 'UPDATE_LOCATION';

export const updateLocation = (path) => (dispatch) => {
  dispatch({
    type: UPDATE_LOCATION,
    path
  });
  dispatch(resetCheckout());
  dispatch(getCategoryItems());
};

export const pushState = (href) => (dispatch) => {
  window.history.pushState({}, '', href);
  dispatch(updateLocation(window.decodeURIComponent(window.location.pathname)));
};
