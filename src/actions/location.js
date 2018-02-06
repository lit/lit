export const UPDATE_LOCATION = 'UPDATE_LOCATION';

export const updateLocation = (path) => {
  return {
    type: UPDATE_LOCATION,
    path
  };
};

export const pushState = (href) => (dispatch) => {
  window.history.pushState({}, '', href);
  dispatch(updateLocation(window.decodeURIComponent(window.location.pathname)));
};
