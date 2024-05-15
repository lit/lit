/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {createContext} from '@lit/context';
import type {Store} from '@reduxjs/toolkit';

/**
 * Unique symbol for thet store context.
 */
export const storeContextKey = Symbol('redux-store');

/**
 * Context used by `Connector` for requesting the Redux store.
 */
export const storeContext = createContext<Store>(storeContextKey);
