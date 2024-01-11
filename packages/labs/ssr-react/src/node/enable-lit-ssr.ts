/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

/**
 * @fileoverview Side-effect import meant to be loaded on the **server** before
 * any user code is loaded. Patches `React.createElement` to support deep SSR of
 * Lit components.
 */

import React from 'react';
import {wrapCreateElement} from '../lib/node/wrap-create-element.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(React.createElement as any) = wrapCreateElement(React.createElement);
