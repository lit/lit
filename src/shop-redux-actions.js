import { findCategory } from './shop-redux-helpers.js';

export function changePath(path) {
  return (dispatch, getState) => {
    const state = getState();
    const pathParts = path.slice(1).split('/');
    const page = pathParts[0];
    const categoryName = pathParts[1];
    const itemName = pathParts[2];
    const category = findCategory(state.categories, categoryName);
    loadCategory(category, dispatch);
    dispatch({
      type: '_pathChanged',
      path
    });
  };
}

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

function loadCategory(category, dispatch) {
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
