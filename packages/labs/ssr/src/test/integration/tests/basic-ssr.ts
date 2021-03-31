/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

/**
 * This module exports the cross-environment test definitions and the
 * server-only SSR render function.
 *
 * Needing this module is a bit of an ergonomics hit, but currently render()
 * needs to be run in the same VM context as the templates in order to rely on
 * object identity for the template cache and to identify directives, and
 * instanceof for certain value types. We might be able to change render()
 * and/or how it's loaded to not need this module.
 */
export {render} from '../../../lib/render-lit-html.js';
export * from './basic.js';
