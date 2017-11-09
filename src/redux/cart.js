import { updateCart } from './actions/cart.js';

const CART_LOCALSTORAGE_KEY = 'shop-cart-data';

function getLocalCartData() {
  const localCartData = localStorage.getItem(CART_LOCALSTORAGE_KEY);
  try {
    return JSON.parse(localCartData) || {};
  } catch (e) {
    return {};
  }
}

export function installCart(store) {
  function handleStorageEvent() {
    store.dispatch(updateCart(getLocalCartData()));
  }
  window.addEventListener('storage', handleStorageEvent);
  handleStorageEvent();

  store.subscribe(() => {
    const state = store.getState();
    localStorage.setItem(CART_LOCALSTORAGE_KEY, JSON.stringify(state.cart));
  });
}
