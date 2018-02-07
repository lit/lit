/**
 * @license
 * Copyright (c) 2018 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
 */

import createStore from '../node_modules/@0xcda7a/redux-es6/es/createStore.js';
import applyMiddleware from '../node_modules/@0xcda7a/redux-es6/es/applyMiddleware.js';
import origCompose from '../node_modules/@0xcda7a/redux-es6/es/compose.js';
import combineReducers from '../node_modules/@0xcda7a/redux-es6/es/combineReducers.js';
import thunk from '../node_modules/redux-thunk/es/index.js';
import { lazyReducerEnhancer } from '../node_modules/redux-helpers/lazy-reducer-enhancer.js';
import categories from './reducers/categories.js';
import announcer from './reducers/announcer.js';
import meta from './reducers/meta.js';
import location from './reducers/location.js';
import network from './reducers/network.js';

const compose = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || origCompose;

export const store = createStore(
  (state, action) => state,
  compose(lazyReducerEnhancer(combineReducers), applyMiddleware(thunk))
);

store.addReducers({
  categories,
  announcer,
  meta,
  location,
  network
});

