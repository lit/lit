import { findCategory } from './shop-redux-helpers.js';

export function changeOffline(offline) {
  return (dispatch, getState) => {
    dispatch({
      type: '_offlineChanged',
      offline
    });
    if (!offline) {
      tryReconnect()(dispatch, getState);
    }
  };
}

export function tryReconnect() {
  return (dispatch, getState) => {
    const state = getState();
    const category = findCategory(state.categories, state.categoryName);
    loadCategory(category, dispatch);
  };
}

export function loadCategory(category, dispatch) {
  if (category) {
    const categoryName = category.name;
    if (!category.items) {
      fetch(`data/${categoryName}.json`)
      .then(res => res.json())
      .then(data => dispatch({
        type: '_categoryItemsChanged',
        categoryName,
        data
      }))
      .catch(() => dispatch({
        type: '_failureChanged',
        failure: true
      }));
    }
  }
}

// Add to cart from detail view.
export function addCartItem(detail) {
  return (dispatch, getState) => {
    const state = getState();
    const cart = state.cart.slice(0);
    const i = findCartItemIndex(cart, detail.item.name, detail.size);
    if (i !== -1) {
      detail.quantity += cart[i].quantity;
    }
    updateCart(dispatch, cart, i, detail);
  };
}

// Update from cart view.
export function setCartItem(detail) {
  return (dispatch, getState) => {
    const state = getState();
    const cart = state.cart.slice(0);
    const i = findCartItemIndex(cart, detail.item.name, detail.size);
    updateCart(dispatch, cart, i, detail);
  };
}

// Clear cart after successful checkout.
export function clearCart(detail) {
  return (dispatch) => {
    localStorage.removeItem('shop-cart-data');
    dispatch({
      type: '_cartChanged',
      cart: []
    });
  };
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

function updateCart(dispatch, cart, i, detail) {
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
  dispatch({
    type: '_cartChanged',
    cart
  });
}
