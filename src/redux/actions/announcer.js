export const ANNOUNCE_LABEL = 'ANNOUNCE_LABEL';
export const CLEAR_LABEL = 'CLEAR_LABEL';

let timer = 0;

export const announceLabel = (label) => (dispatch) => {
  dispatch({
    type: CLEAR_LABEL
  });
  // Debounce announcements.
  clearTimeout(timer);
  timer = setTimeout(() => {
    dispatch({
      type: ANNOUNCE_LABEL,
      label
    });
  }, 300);
};
