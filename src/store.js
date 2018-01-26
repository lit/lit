import createStore from '../../node_modules/@0xcda7a/redux-es6/es/createStore.js';
import applyMiddleware from '../../node_modules/@0xcda7a/redux-es6/es/applyMiddleware.js';
import origCompose from '../../node_modules/@0xcda7a/redux-es6/es/compose.js';
import combineReducers from '../../../node_modules/@0xcda7a/redux-es6/es/combineReducers.js';
import thunk from '../../node_modules/redux-thunk/es/index.js';
import categories from './reducers/categories.js';
import location from './reducers/location.js';
import network from './reducers/network.js';
import announcer from './reducers/announcer.js';
import meta from './reducers/meta.js';
import { installLocation } from './location.js';
import { installNetwork } from './network.js';

const compose = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || origCompose;

function lazyReducerEnhancer(nextCreator) {
  return (origReducer, preloadedState) => {
    let lazyReducers = {};
    const nextStore = nextCreator(origReducer, preloadedState);
    return {
      ...nextStore,
      addReducers(newReducers) {
        this.replaceReducer(combineReducers(lazyReducers = {
          ...lazyReducers,
          ...newReducers
        }));
      }
    }
  }
}

export const store = createStore(
  (state, action) => state,
  compose(lazyReducerEnhancer, applyMiddleware(thunk))
);

store.addReducers({
  categories,
  location,
  network,
  announcer,
  meta,
});

installLocation(store);
installNetwork(store);
