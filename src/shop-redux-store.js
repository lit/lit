import createStore from '../node_modules/@0xcda7a/redux-es6/es/createStore.js';

const store = createStore(
  (state, action) => {
    let result = state;

    switch (action.type) {
      case '_pathChanged':
        {
          const pathParts = action.path.slice(1).split('/');
          const page = pathParts[0];
          const categoryName = pathParts[1];
          const itemName = pathParts[2];
          const category = findCategory(state.categories, categoryName);
          if (category) {
            if (!category.items) {
              fetch(`data/${category.name}.json`)
              .then(res => res.json())
              .then(data => store.dispatch({
                type: '_categoryItemsChanged',
                categoryName,
                data
              }));
            }
          }
          result = {
            ...state,
            page,
            categoryName,
            category,
            itemName,
            item: findItem(category, itemName)
          };
        }
        break;
      case '_categoryItemsChanged':
        {
          const categories = state.categories;
          const categoryIndex = findCategoryIndex(categories, action.categoryName);
          categories[categoryIndex] = {...categories[categoryIndex], items: action.data};
          // The current category may have changed if the user navigated before the
          // fetch returns, so update the current cateogry/item based on current state.
          const category = findCategory(categories, state.categoryName);
          result = {
            ...state,
            categories: [...categories],
            category,
            item: findItem(category, state.itemName)
          };
        }
        break;
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
      case 'add-cart-item':
        {
          const cart = state.cart;
          const detail = action.detail;
          const i = findCartItemIndex(cart, detail.item.name, detail.size);
          if (i !== -1) {
            detail.quantity += cart[i].quantity;
          }
          if (detail.quantity === 0) {
            // Remove item from cart when the new quantity is 0.
            if (i !== -1) {
              cart.splice(i, 1);
            }
          } else {
            if (i !== -1) {
              cart.splice(i, 1, detail);
            } else {
              cart.push(detail);
            }
          }

          localStorage.setItem('shop-cart-data', JSON.stringify(cart));
          result = {
            ...state,
            cart: [...cart],
            numItems: computeNumItems(cart),
            total: computeTotal(cart)
          };
        }
        break;
      case 'set-cart-item':
        {
          const cart = state.cart;
          const detail = action.detail;
          const i = findCartItemIndex(cart, detail.item.name, detail.size);
          if (detail.quantity === 0) {
            // Remove item from cart when the new quantity is 0.
            if (i !== -1) {
              cart.splice(i, 1);
            }
          } else {
            if (i !== -1) {
              cart.splice(i, 1, detail);
            } else {
              cart.push(detail);
            }
          }

          localStorage.setItem('shop-cart-data', JSON.stringify(cart));
          result = {
            ...state,
            cart: [...cart],
            numItems: computeNumItems(cart),
            total: computeTotal(cart)
          };
        }
        break;
      case 'clear-cart':
        {
          result = {
            ...state,
            cart: [],
            numItems: 0,
            total: 0
          };
        }
        break;
    }
    console.log('reducer', state.item, action, result.item)
    return result;
  },
  getInitialState());

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

function findCategoryIndex(categories, categoryName) {
  for (let i = 0, c; c = categories[i]; ++i) {
    if (c.name === categoryName) {
      return i;
    }
  }
  return null;
}

function findCategory(categories, categoryName) {
  return categories[findCategoryIndex(categories, categoryName)] || null;
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


function findCartItemIndex(cart, name, size) {
  if (cart) {
    for (let i = 0; i < cart.length; ++i) {
      let entry = cart[i];
      if (entry.item.name === name && entry.size === size) {
        return i;
      }
    }
  }

  return -1;
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
