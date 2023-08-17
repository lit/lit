/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
import {
  html as coreHtml,
  svg as coreSvg,
  type TemplateResult,
} from 'lit/html.js';

import {watch} from './watch.js';
import {Signal} from '@preact/signals-core';

/**
 * Wraps a lit-html template tag function (`html` or `svg`) to add support for
 * automatically wrapping Signal instances in the `watch()` directive.
 */
export const withWatch =
  (coreTag: typeof coreHtml | typeof coreSvg) =>
  (strings: TemplateStringsArray, ...values: unknown[]): TemplateResult => {
    // TODO (justinfagnani): use an alternative to instanceof when
    // one is available. See https://github.com/preactjs/signals/issues/402
    return coreTag(
      strings,
      ...values.map((v) => (v instanceof Signal ? watch(v) : v))
    );
  };

/**
 * Interprets a template literal as an HTML template that can efficiently
 * render to and update a container.
 *
 * Includes signal watching support from `withWatch()`.
 */
export const html = withWatch(coreHtml);

/**
 * Interprets a template literal as an SVG template that can efficiently
 * render to and update a container.
 *
 * Includes signal watching support from `withWatch()`.
 */
export const svg = withWatch(coreSvg);
