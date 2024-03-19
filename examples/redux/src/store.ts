/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {configureStore} from '@reduxjs/toolkit';
import counterReducer from './counter-slice.js';

export const store = configureStore({
  reducer: {
    counter: counterReducer,
  },
});

export type AppStore = typeof store;
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
