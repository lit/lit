/**
 * @license
 * Copyright (c) 2018 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
 */

import { UPDATE_LOCATION, RECEIVE_LAZY_RESOURCES, SET_PATH_IS_VALID, SET_PATH_IS_INVALID } from '../actions/location.js';
import { createSelector } from '../../node_modules/reselect/es/index.js';

const location = (state = {}, action) => {
  switch (action.type) {
    case UPDATE_LOCATION:
      return {
        ...state,
        path: action.path
      };
    case RECEIVE_LAZY_RESOURCES:
      return {
        ...state,
        lazyResourcesLoadComplete: true
      }
    case SET_PATH_IS_VALID:
      return {
        ...state,
        validPath: true
      }
    case SET_PATH_IS_INVALID:
      return {
        ...state,
        validPath: false
      }
    default:
      return state;
  }
}

export default location;

const pathSelector = state => state.location.path;

export const splitPathSelector = createSelector(
  pathSelector,
  path => {
    return (path || '').slice(1).split('/');
  }
);

export const pageSelector = createSelector(
  splitPathSelector,
  splitPath => {
    return splitPath[0] || 'home';
  }
);
