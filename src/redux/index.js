import createStore from '../../node_modules/@0xcda7a/redux-es6/es/createStore.js';
import applyMiddleware from '../../node_modules/@0xcda7a/redux-es6/es/applyMiddleware.js';
import origCompose from '../../node_modules/@0xcda7a/redux-es6/es/compose.js';
import thunk from '../../node_modules/redux-thunk/es/index.js';
import reducer from './reducers/index.js';
import { getAllCategories } from './actions/categories.js';
import { installLocation } from './location.js';
import { installNetwork } from './network.js';
import { installCart } from './cart.js';

const compose = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || origCompose;

export const store = createStore(
  reducer,
  compose(applyMiddleware(thunk))
);

store.dispatch(getAllCategories());
installLocation(store);
installNetwork(store);
installCart(store);
