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
/* eslint-disable import/extensions */
import ReactJSXRuntime from 'react/jsx-runtime';
import ReactJSXDevRuntime from 'react/jsx-dev-runtime';
import {wrapCreateElement} from '../lib/node/wrap-create-element.js';
import {wrapJsx, wrapJsxDev, wrapJsxs} from '../lib/node/wrap-jsx.js';

/* eslint-disable @typescript-eslint/no-explicit-any */
// The `.default ??` is used to get around inconsistent behavior with how
// tools like webpack seem to do es module interop.
Object.assign((React as any).default ?? React, {
  createElement: wrapCreateElement(React.createElement),
});
if (process.env.NODE_ENV === 'production') {
  Object.assign((ReactJSXRuntime as any).default ?? ReactJSXRuntime, {
    jsx: wrapJsx(ReactJSXRuntime.jsx, ReactJSXRuntime.jsxs),
    jsxs: wrapJsxs(ReactJSXRuntime.jsxs),
  });
} else {
  Object.assign((ReactJSXDevRuntime as any).default ?? ReactJSXDevRuntime, {
    jsxDEV: wrapJsxDev(ReactJSXDevRuntime.jsxDEV),
  });
}

globalThis.litSsrReactEnabled = true;
