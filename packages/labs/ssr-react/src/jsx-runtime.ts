/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

/**
 * @fileoverview To serve as JSX import source for runtime JSX transforms in
 * production mode. For use in browsers.
 */

import '@lit-labs/ssr-client/lit-element-hydrate-support.js';
// eslint-disable-next-line import/extensions
export {Fragment, jsx, jsxs} from 'react/jsx-runtime';
