/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

try {
  // Detect whether the environment supports importing CSS files.
  const cssImportsSupported = await import('./detection.css', {
    with: {type: 'css'},
  })
    .then(() => true)
    .catch(() => false);

  // Avoid breaking non-Node.js environments by checking for the
  // existance of register on the node:module import.
  const nodeModule = cssImportsSupported ? null : await import('node:module');
  if (nodeModule && 'register' in nodeModule.default) {
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
    nodeModule.default.register('./lib/css-hook.js', {
      parentURL: import.meta.url,
    });
  }
} catch {
  /* empty */
}
