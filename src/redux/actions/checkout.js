export const UPDATE_CHECKOUT_STATE = 'UPDATE_CHECKOUT_STATE';

export const updateCheckoutState = (state) => {
  return {
    type: UPDATE_CHECKOUT_STATE,
    state
  };
};
