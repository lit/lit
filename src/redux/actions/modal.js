export const SHOW_MODAL = 'SHOW_MODAL';
export const HIDE_MODAL = 'HIDE_MODAL';

let timer = 0;

export const displayModal = (label) => (dispatch) => {
  dispatch({
    type: SHOW_MODAL
  });
  // Debounce announcements.
  clearTimeout(timer);
  timer = setTimeout(() => {
    dispatch({
      type: HIDE_MODAL
    });
  }, 300);
};
