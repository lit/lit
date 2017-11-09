import { getCategoryItems } from './categories.js';

export const UPDATE_NETWORK_FAILURE = 'UPDATE_NETWORK_FAILURE';
export const UPDATE_NETWORK_STATUS = 'UPDATE_NETWORK_STATUS';

export const updateNetworkFailure = (failure) => {
  return {
    type: UPDATE_NETWORK_FAILURE,
    failure
  };
};

export const updateNetworkStatus = (online) => (dispatch) => {
  dispatch({
    type: UPDATE_NETWORK_STATUS,
    online
  });
  if (online) {
    dispatch(getCategoryItems());
  }
};
