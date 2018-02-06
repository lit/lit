import createStore from '../../node_modules/@0xcda7a/redux-es6/es/createStore.js';
import applyMiddleware from '../../node_modules/@0xcda7a/redux-es6/es/applyMiddleware.js';
import origCompose from '../../node_modules/@0xcda7a/redux-es6/es/compose.js';
import combineReducers from '../../../node_modules/@0xcda7a/redux-es6/es/combineReducers.js';
import thunk from '../../node_modules/redux-thunk/es/index.js';
import { lazyReducerEnhancer } from '../../node_modules/redux-helpers/lazyReducerEnhancer.js';
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

