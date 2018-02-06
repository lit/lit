import {
  RECEIVE_CATEGORIES,
  RECEIVE_CATEGORY_ITEMS,
  FAIL_CATEGORY_ITEMS,
  REQUEST_CATEGORY_ITEMS
} from '../actions/categories.js';
import { createSelector } from '../../../node_modules/reselect/es/index.js';
import { splitPathSelector } from './location.js';

const categories = (state = {}, action) => {
  switch (action.type) {
    case RECEIVE_CATEGORIES:
      return {
        ...state,
        ...action.categories
      };
    case REQUEST_CATEGORY_ITEMS:
    case RECEIVE_CATEGORY_ITEMS:
    case FAIL_CATEGORY_ITEMS:
      const categoryId = action.categoryId;
      return {
        ...state,
        [categoryId]: category(state[categoryId], action)
      };
    default:
      return state;
  }
}

const category = (state = {}, action) => {
  switch (action.type) {
    case REQUEST_CATEGORY_ITEMS:
      return {
        ...state,
        failure: false,
        isFetching: true
      };
    case RECEIVE_CATEGORY_ITEMS:
      return {
        ...state,
        failure: false,
        isFetching: false,
        items: {
          ...action.items.reduce((obj, item) => {
            obj[item.name] = item;
            return obj;
          }, {})
        }
      };
    case FAIL_CATEGORY_ITEMS:
      const categoryId = action.categoryId;
      return {
        ...state,
        failure: true,
        isFetching: false
      };
    default:
      return state;
  }
}

export default categories;

const categoriesSelector = state => state.categories;

export const currentCategorySelector = createSelector(
  categoriesSelector,
  splitPathSelector,
  (categories, splitPath) => {
    return ['list', 'detail'].indexOf(splitPath[0]) !== -1 ? categories[splitPath[1]] : null;
  }
);

export const currentItemSelector = createSelector(
  currentCategorySelector,
  splitPathSelector,
  (category, splitPath) => {
    return category && category.items && category.items[splitPath[2]];
  }
);
