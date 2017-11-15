import { fetchCategoryItems } from './categories.js';
import { currentCategorySelector } from '../reducers/categories.js';

export const UPDATE_NETWORK_STATUS = 'UPDATE_NETWORK_STATUS';

export const updateNetworkStatus = (online) => (dispatch, getState) => {
  dispatch({
    type: UPDATE_NETWORK_STATUS,
    online
  });
  if (online) {
    dispatch(fetchCategoryItems(currentCategorySelector(getState())));
  }
};
