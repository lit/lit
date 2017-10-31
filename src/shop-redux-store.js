import createStore from '../node_modules/@0xcda7a/redux-es6/es/createStore.js';
import applyMiddleware from '../node_modules/@0xcda7a/redux-es6/es/applyMiddleware.js';
import origCompose from '../node_modules/@0xcda7a/redux-es6/es/compose.js';
import thunk from '../node_modules/redux-thunk/es/index.js';

import { findCategory, findCategoryIndex } from './shop-redux-helpers.js';

const compose = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || origCompose;

const store = createStore(
  (state, action) => {
    let result = state;

    switch (action.type) {
      // window.location changed
      case '_pathChanged':
        {
          const pathParts = action.path.slice(1).split('/');
          const page = pathParts[0];
          const categoryName = pathParts[1];
          const itemName = pathParts[2];
          const category = findCategory(state.categories, categoryName);
          result = {
            ...state,
            page,
            categoryName,
            category,
            itemName,
            item: findItem(category, itemName),
            checkoutState: 'init',
            failure: false
          };
        }
        break;
      // Response from fetch for categories data.
      case '_categoryItemsChanged':
        {
          const categories = state.categories.slice(0);
          const categoryIndex = findCategoryIndex(categories, action.categoryName);
          categories[categoryIndex] = {...categories[categoryIndex], items: action.data};
          // The current category may have changed if the user navigated before the
          // fetch returns, so update the current cateogry/item based on current state.
          const category = findCategory(categories, state.categoryName);
          result = {
            ...state,
            categories,
            category,
            item: findItem(category, state.itemName),
            failure: false
          };
        }
        break;
      // Cart initialization/update from another window.
      case '_cartChanged':
        {
          const cart = action.cart;
          result = {
            ...state,
            cart,
            numItems: computeNumItems(cart),
            total: computeTotal(cart)
          };
        }
        break;
      // Internal state from checkout flow (init/success/error).
      case '_checkoutStateChanged':
        {
          const checkoutState = action.checkoutState;
          result = {
            ...state,
            checkoutState
          };
        }
        break;
      // Network error (set to true by unsucessful fetch).
      case '_failureChanged':
        {
          const failure = action.failure;
          result = {
            ...state,
            failure
          };
        }
        break;
      // Opposite of navigator.onLine (updated by shop-app).
      case '_offlineChanged':
        {
          const offline = action.offline;
          result = {
            ...state,
            offline
          };
        }
        break;
    }
    return result;
  },
  getInitialState(),
  compose(applyMiddleware(thunk)));

window.addEventListener('storage', () => {
  store.dispatch({
    type: '_cartChanged',
    cart: getLocalCartData()
  });
});

function getInitialState() {
  const cart = getLocalCartData();
  return {
    categories: [
      {
        name: 'mens_outerwear',
        title: 'Men\'s Outerwear',
        image: 'images/mens_outerwear.jpg',
        placeholder: 'data:image/jpeg;base64,/9j/4QAYRXhpZgAASUkqAAgAAAAAAAAAAAAAAP/sABFEdWNreQABAAQAAAAeAAD/7gAOQWRvYmUAZMAAAAAB/9sAhAAQCwsLDAsQDAwQFw8NDxcbFBAQFBsfFxcXFxcfHhcaGhoaFx4eIyUnJSMeLy8zMy8vQEBAQEBAQEBAQEBAQEBAAREPDxETERUSEhUUERQRFBoUFhYUGiYaGhwaGiYwIx4eHh4jMCsuJycnLis1NTAwNTVAQD9AQEBAQEBAQEBAQED/wAARCAADAA4DASIAAhEBAxEB/8QAXAABAQEAAAAAAAAAAAAAAAAAAAIEAQEAAAAAAAAAAAAAAAAAAAACEAAAAwYHAQAAAAAAAAAAAAAAERMBAhIyYhQhkaEDIwUVNREBAAAAAAAAAAAAAAAAAAAAAP/aAAwDAQACEQMRAD8A3dkr5e8tfpwuneJITOzIcmQpit037Bw4mnCVNOpAAQv/2Q=='
      },
      {
        name: 'ladies_outerwear',
        title: 'Ladies Outerwear',
        image: 'images/ladies_outerwear.jpg',
        placeholder: 'data:image/jpeg;base64,/9j/4QAYRXhpZgAASUkqAAgAAAAAAAAAAAAAAP/sABFEdWNreQABAAQAAAAeAAD/7gAOQWRvYmUAZMAAAAAB/9sAhAAQCwsLDAsQDAwQFw8NDxcbFBAQFBsfFxcXFxcfHhcaGhoaFx4eIyUnJSMeLy8zMy8vQEBAQEBAQEBAQEBAQEBAAREPDxETERUSEhUUERQRFBoUFhYUGiYaGhwaGiYwIx4eHh4jMCsuJycnLis1NTAwNTVAQD9AQEBAQEBAQEBAQED/wAARCAADAA4DASIAAhEBAxEB/8QAWQABAQAAAAAAAAAAAAAAAAAAAAEBAQEAAAAAAAAAAAAAAAAAAAIDEAABAwMFAQAAAAAAAAAAAAARAAEygRIDIlITMwUVEQEBAAAAAAAAAAAAAAAAAAAAQf/aAAwDAQACEQMRAD8Avqn5meQ0kwk1UyclmLtNj7L4PQoioFf/2Q=='
      },
      {
        name: 'mens_tshirts',
        title: 'Men\'s T-Shirts',
        image: 'images/mens_tshirts.jpg',
        placeholder: 'data:image/jpeg;base64,/9j/4QAYRXhpZgAASUkqAAgAAAAAAAAAAAAAAP/sABFEdWNreQABAAQAAAAeAAD/7gAOQWRvYmUAZMAAAAAB/9sAhAAQCwsLDAsQDAwQFw8NDxcbFBAQFBsfFxcXFxcfHhcaGhoaFx4eIyUnJSMeLy8zMy8vQEBAQEBAQEBAQEBAQEBAAREPDxETERUSEhUUERQRFBoUFhYUGiYaGhwaGiYwIx4eHh4jMCsuJycnLis1NTAwNTVAQD9AQEBAQEBAQEBAQED/wAARCAADAA4DASIAAhEBAxEB/8QAWwABAQEAAAAAAAAAAAAAAAAAAAMEAQEAAAAAAAAAAAAAAAAAAAAAEAABAwEJAAAAAAAAAAAAAAARAAESEyFhodEygjMUBREAAwAAAAAAAAAAAAAAAAAAAEFC/9oADAMBAAIRAxEAPwDb7kupZU1MTGnvOCgxpvzEXTyRElCmf//Z'
      },
      {
        name: 'ladies_tshirts',
        title: 'Ladies T-Shirts',
        image: 'images/ladies_tshirts.jpg',
        placeholder: 'data:image/jpeg;base64,/9j/4QAYRXhpZgAASUkqAAgAAAAAAAAAAAAAAP/sABFEdWNreQABAAQAAAAeAAD/7gAOQWRvYmUAZMAAAAAB/9sAhAAQCwsLDAsQDAwQFw8NDxcbFBAQFBsfFxcXFxcfHhcaGhoaFx4eIyUnJSMeLy8zMy8vQEBAQEBAQEBAQEBAQEBAAREPDxETERUSEhUUERQRFBoUFhYUGiYaGhwaGiYwIx4eHh4jMCsuJycnLis1NTAwNTVAQD9AQEBAQEBAQEBAQED/wAARCAADAA4DASIAAhEBAxEB/8QAXwABAQEAAAAAAAAAAAAAAAAAAAMFAQEBAAAAAAAAAAAAAAAAAAABAhAAAQIDCQAAAAAAAAAAAAAAEQABITETYZECEjJCAzMVEQACAwAAAAAAAAAAAAAAAAAAATFBgf/aAAwDAQACEQMRAD8AzeADAZiFc5J7BC9Scek3VrtooilSNaf/2Q=='
      }
    ],
    cart,
    numItems: computeNumItems(cart),
    total: computeTotal(cart)
  };
}

function findItem(category, itemName) {
  if (!category || !category.items || !itemName) {
    return;
  }
  for (let i = 0, item; item = category.items[i]; ++i) {
    if (item.name === itemName) {
      return item;
    }
  }
}

function getLocalCartData() {
  const localCartData = localStorage.getItem('shop-cart-data');
  try {
    return JSON.parse(localCartData) || [];
  } catch (e) {
    return [];
  }
}

function computeNumItems(cart) {
  if (cart) {
    return cart.reduce((total, entry) => {
      return total + entry.quantity;
    }, 0);
  }

  return 0;
}

function computeTotal(cart) {
  if (cart) {
    return cart.reduce((total, entry) => {
      return total + entry.quantity * entry.item.price;
    }, 0);
  }

  return 0;
}

export { store };
