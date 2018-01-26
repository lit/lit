import { pageSelector } from '../reducers/location.js';
import { updateMeta } from './meta.js';
import { currentItemSelector } from '../reducers/categories.js';

export const REQUEST_CATEGORY_ITEMS = 'REQUEST_CATEGORY_ITEMS';
export const RECEIVE_CATEGORY_ITEMS = 'RECEIVE_CATEGORY_ITEMS';
export const FAIL_CATEGORY_ITEMS = 'FAIL_CATEGORY_ITEMS';

export const fetchCategoryItems = (category) => (dispatch) => {
  if (category && !category.items && !category.isFetching) {
    dispatch(requestCategoryItems(category.name));
    return fetch(`data/${category.name}.json`)
      .then(res => res.json())
      .then(items => dispatch(receiveCategoryItems(category.name, items)))
      .catch(() => dispatch(failCategoryItems(category.name)));
  }
};

const requestCategoryItems = (categoryId) => {
  return {
    type: REQUEST_CATEGORY_ITEMS,
    categoryId
  };
};

const receiveCategoryItems = (categoryId, items) => (dispatch, getState) => {
  dispatch({
    type: RECEIVE_CATEGORY_ITEMS,
    categoryId,
    items
  });

  // NOTE: The UPDATE_META action below needs to be created with the updated state (i.e.
  // the state with the new category.items), so it cannot be combined with
  // RECEIVE_CATEGORY_ITEMS.
  const state = getState();
  if (pageSelector(state) === 'detail') {
    const item = currentItemSelector(state);
    dispatch(updateMeta({
      title: item.title,
      description: item.description.substring(0, 100),
      image: document.baseURI + item.image
    }));
  }
};

const failCategoryItems = (categoryId) => {
  return {
    type: FAIL_CATEGORY_ITEMS,
    categoryId
  };
};
