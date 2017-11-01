import createStore from '../node_modules/@0xcda7a/redux-es6/es/createStore.js';
import applyMiddleware from '../node_modules/@0xcda7a/redux-es6/es/applyMiddleware.js';
import origCompose from '../node_modules/@0xcda7a/redux-es6/es/compose.js';
import thunk from '../node_modules/redux-thunk/es/index.js';

const compose = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || origCompose;

const reducers = {};

export function installReducers(r) {
  Object.assign(reducers, r);
}

export const store = createStore(
  (state, action) => {
    const r = reducers[action.type];
    return r ? r(state, action) : state;
  },
  compose(applyMiddleware(thunk)));
