import { findCategory } from './shop-redux-helpers.js';

export function changeOffline(offline) {
  return (dispatch, getState) => {
    dispatch({
      type: '_offlineChanged',
      offline
    });
    if (!offline) {
      tryReconnect()(dispatch, getState);
    }
  };
}

export function tryReconnect() {
  return (dispatch, getState) => {
    const state = getState();
    const category = findCategory(state.categories, state.categoryName);
    loadCategory(category, dispatch);
  };
}

export function loadCategory(category, dispatch) {
  if (category) {
    const categoryName = category.name;
    if (!category.items) {
      fetch(`data/${categoryName}.json`)
      .then(res => res.json())
      .then(data => dispatch({
        type: '_categoryItemsChanged',
        categoryName,
        data
      }))
      .catch(() => dispatch({
        type: '_failureChanged',
        failure: true
      }));
    }
  }
}
