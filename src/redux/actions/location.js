import { fetchCategoryItems } from './categories.js';
import { currentCategorySelector, currentItemSelector } from '../reducers/categories.js';
import { pageSelector } from '../reducers/location.js';
import { updateMeta } from './meta.js';

export const UPDATE_LOCATION = 'UPDATE_LOCATION';

export const updateLocation = (path) => (dispatch, getState) => {
  dispatch({
    type: UPDATE_LOCATION,
    path
  });

  // NOTE: The below actions need to be created with the updated state (i.e. the state
  // with the new location.path), so they cannot be combined with UPDATE_LOCATION.
  const state = getState();
  dispatch(fetchCategoryItems(currentCategorySelector(state)));
  switch (pageSelector(state)) {
    case 'home':
      dispatch(updateMeta({ title: 'Home' }));
      break;
    case 'list':
      const category = currentCategorySelector(state);
      dispatch(updateMeta({
        title: category.title,
        image: document.baseURI + category.image
      }));
      break;
    case 'detail':
      const item = currentItemSelector(state);
      // Item is async loaded, so check if it has loaded yet. If not, meta will
      // be updated in REQUEST_CATEGORY_ITEMS instead.
      if (item) {
        dispatch(updateMeta({
          title: item.title,
          description: item.description.substring(0, 100),
          image: document.baseURI + item.image
        }));
      }
      break;
    case 'cart':
      dispatch(updateMeta({ title: 'Cart' }));
      break;
    case 'checkout':
      dispatch(updateMeta({ title: 'Checkout' }));
      break;
  }
};

export const pushState = (href) => (dispatch) => {
  window.history.pushState({}, '', href);
  dispatch(updateLocation(window.decodeURIComponent(window.location.pathname)));
};
