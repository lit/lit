/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

/**
 * @fileoverview To serve as JSX import source for runtime JSX transforms in
 * production mode. For use in servers.
 */

// eslint-disable-next-line import/extensions
import ReactJSXRuntime from 'react/jsx-runtime';
import {wrapJsx, wrapJsxs} from '../lib/node/wrap-jsx.js';

export const Fragment = ReactJSXRuntime.Fragment;

export const jsx = wrapJsx(ReactJSXRuntime.jsx, ReactJSXRuntime.jsxs);

export const jsxs = wrapJsxs(ReactJSXRuntime.jsxs);
