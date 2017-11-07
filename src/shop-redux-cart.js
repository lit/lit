import { store, installReducers } from './shop-redux-store.js';

installReducers({
  // Cart initialization/update from another window.
  _cartChanged(state, action) {
    const cart = action.cart;
    return {
      ...state,
      cart
    };
  }
});

function initCart() {
  store.dispatch({
    type: '_cartChanged',
    cart: getLocalCartData()
  });
}
window.addEventListener('storage', initCart);
initCart();

function getLocalCartData() {
  const localCartData = localStorage.getItem('shop-cart-data');
  try {
    return JSON.parse(localCartData) || [];
  } catch (e) {
    return [];
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
