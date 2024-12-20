/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {register} from 'node:module';

/**
 * This module registers a Node.js Hook for loading CSS
 * files as CSSStyleSheet instances.
 *
 * @example
 *
 * ```ts
 *  import styles from 'my-styles.css' with {type: 'css'};
 * ```
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/import/with
 * @see https://nodejs.org/api/module.html#customization-hooks
 */
register('./lib/css-loader.js', {parentURL: import.meta.url});
