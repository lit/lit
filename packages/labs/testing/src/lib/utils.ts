/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

export const nextFrame = () =>
  new Promise((resolve) => requestAnimationFrame(resolve));

/**
 * Strips Lit expression comments from provided html string.
 */
export const stripExpressionComments = (html: string) =>
  html.replace(/<!--\?lit\$[0-9]+\$-->|<!--\??-->/g, '');

/**
 * Strips Lit expression markers from provided html string.
 */
export const stripExpressionMarkers = (html: string) =>
  html.replace(/<!--\?lit\$[0-9]+\$-->|<!--\??-->|lit\$[0-9]+\$/g, '');
