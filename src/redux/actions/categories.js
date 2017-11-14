import { getLocationPathPart } from '../helpers/location.js';

export const REQUEST_CATEGORY_ITEMS = 'REQUEST_CATEGORY_ITEMS';
export const RECEIVE_CATEGORY_ITEMS = 'RECEIVE_CATEGORY_ITEMS';
export const FAIL_CATEGORY_ITEMS = 'FAIL_CATEGORY_ITEMS';

export const fetchCategoryItems = () => (dispatch, getState) => {
  const state = getState();
  const categoryId = getLocationPathPart(state, 1);
  if (categoryId) {
    const category = state.categories[categoryId];
    if (category && !category.items && !category.isFetching) {
      dispatch(requestCategoryItems(categoryId));
      return fetch(`data/${categoryId}.json`)
        .then(res => res.json())
        .then(items => {
          dispatch(receiveCategoryItems(categoryId, items));
        })
        .catch(() => dispatch(failCategoryItems(categoryId)));
    }
  }
};

const requestCategoryItems = (categoryId) => {
  return {
    type: REQUEST_CATEGORY_ITEMS,
    categoryId
  };
};

const receiveCategoryItems = (categoryId, items) => {
  return {
    type: RECEIVE_CATEGORY_ITEMS,
    categoryId,
    items
  };
};

const failCategoryItems = (categoryId) => {
  return {
    type: FAIL_CATEGORY_ITEMS,
    categoryId
  };
};
