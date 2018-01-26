import { announceLabel } from "./announcer.js";

export const UPDATE_META = 'UPDATE_META';

export const updateMeta = (detail) => (dispatch) => {
  dispatch({
    type: UPDATE_META,
    detail
  });
  dispatch(announceLabel(`${detail.title}, loaded`));
};
