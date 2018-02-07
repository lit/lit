/**
 * @license
 * Copyright (c) 2018 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
 */

import {
  RECEIVE_CATEGORIES,
  RECEIVE_CATEGORY_ITEMS,
  FAIL_CATEGORY_ITEMS,
  REQUEST_CATEGORY_ITEMS
} from '../actions/categories.js';
import { createSelector } from '../../node_modules/reselect/es/index.js';
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
    if (['list', 'detail'].indexOf(splitPath[0]) !== -1) {
      // Empty object means categories are loading and category may exist, whereas
      // undefined means categories have loaded but category doesn't exist.
      return Object.values(categories).length === 0 ? {} : categories[splitPath[1]];
    } else {
      return null;
    }
  }
);

export const currentItemSelector = createSelector(
  currentCategorySelector,
  splitPathSelector,
  (category, splitPath) => {
    if (splitPath[0] === 'detail') {
      // Empty object means category is loading and item may exist, whereas
      // undefined means category has loaded but item doesn't exist.
      return !category || !category.items ? {} : category.items[splitPath[2]];
    } else {
      return null;
    }
  }
);
