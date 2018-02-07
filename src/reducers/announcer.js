/**
 * @license
 * Copyright (c) 2018 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
 */

import { CLEAR_ANNOUNCER_LABEL, SET_ANNOUNCER_LABEL } from '../actions/announcer.js';

const announcer = (state = {}, action) => {
  switch (action.type) {
    case CLEAR_ANNOUNCER_LABEL:
      return {
        ...state,
        label: ''
      };
    case SET_ANNOUNCER_LABEL:
      return {
        ...state,
        label: action.label
      };
    default:
      return state;
  }
}

export default announcer;
