export const SET_ANNOUNCER_LABEL = 'SET_ANNOUNCER_LABEL';
export const CLEAR_ANNOUNCER_LABEL = 'CLEAR_ANNOUNCER_LABEL';

let timer = 0;

const setAnnouncerLabel = (label) => {
  return {
    type: SET_ANNOUNCER_LABEL,
    label
  };
};

const clearAnnouncerLabel = () => {
  return {
    type: CLEAR_ANNOUNCER_LABEL
  };
};

export const announceLabel = (label) => (dispatch) => {
  dispatch(clearAnnouncerLabel());
  // Debounce announcements.
  clearTimeout(timer);
  timer = setTimeout(() => {
    dispatch(setAnnouncerLabel(label));
  }, 300);
};
