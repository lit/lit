export const REQUEST_CATEGORY_ITEMS = 'REQUEST_CATEGORY_ITEMS';
export const RECEIVE_CATEGORY_ITEMS = 'RECEIVE_CATEGORY_ITEMS';
export const FAIL_CATEGORY_ITEMS = 'FAIL_CATEGORY_ITEMS';

export const fetchCategoryItems = (category) => (dispatch) => {
  if (category && !category.items && !category.isFetching) {
    dispatch(requestCategoryItems(category.name));
    return fetch(`data/${category.name}.json`)
      .then(res => res.json())
      .then(items => {
        dispatch(receiveCategoryItems(category.name, items));
      })
      .catch(() => dispatch(failCategoryItems(category.name)));
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
