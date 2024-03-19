/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {Selector} from '@lit-labs/redux';
import type {AppStore} from './store.js';

// Create a Selector controller providing the AppStore type for better type
// checks on selector functions and returned values.
// Similar idea as:
// https://redux.js.org/tutorials/typescript-quick-start#define-typed-hooks
export const AppSelector = Selector.withStoreType<AppStore>();
