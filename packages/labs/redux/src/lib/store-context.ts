/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {createContext} from '@lit/context';
import type {Store} from '@reduxjs/toolkit';

export const storeContextKey = Symbol('redux-store');
export const storeContext = createContext<Store>(storeContextKey);
