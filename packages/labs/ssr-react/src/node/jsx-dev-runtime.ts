/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

/**
 * @fileoverview To serve as JSX import source for runtime JSX transforms in
 * development mode. For use in servers.
 */

// eslint-disable-next-line import/extensions
import ReactJSXDevRuntime from 'react/jsx-dev-runtime';
import {wrapJsxDev} from '../lib/node/wrap-jsx.js';

export const Fragment = ReactJSXDevRuntime.Fragment;

export const jsxDEV = wrapJsxDev(ReactJSXDevRuntime.jsxDEV);
