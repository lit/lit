/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {createSlice} from '@reduxjs/toolkit';
import {configureStore} from '@reduxjs/toolkit';

const counterSlice = createSlice({
  name: 'counter',
  initialState: {value: 0, flag: false},
  reducers: {
    increment: (state) => {
      state.value += 1;
    },
    toggle: (state) => {
      state.flag = !state.flag;
    },
    reset: (state) => {
      state.value = 0;
    },
  },
});

export const {increment, toggle, reset} = counterSlice.actions;

export const store = configureStore({
  reducer: {
    counter: counterSlice.reducer,
  },
});

export type AppStore = typeof store;
export type AppDispatch = typeof store.dispatch;
export type RootState = ReturnType<typeof store.getState>;
