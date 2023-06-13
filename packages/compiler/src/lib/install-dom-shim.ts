/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {getWindow} from './dom-shim.js';
Object.assign(globalThis, getWindow());
