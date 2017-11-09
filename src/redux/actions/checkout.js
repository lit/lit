export const RESET_CHECKOUT = 'RESET_CHECKOUT';
export const UPDATE_CHECKOUT_STATE = 'UPDATE_CHECKOUT_STATE';

export const resetCheckout = () => {
  return {
    type: RESET_CHECKOUT
  };
};

export const updateCheckoutState = (state) => {
  return {
    type: UPDATE_CHECKOUT_STATE,
    state
  };
};
