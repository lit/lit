/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {isStrTagged, joinStringsAndValues} from './str-tag.js';

import type {MsgFn, TemplateLike} from './types.js';

/**
 * Default identity msg implementation. Simply returns the input template with
 * no awareness of translations. If the template is str-tagged, returns it in
 * string form.
 */
export const defaultMsg = ((template: TemplateLike) =>
  isStrTagged(template)
    ? joinStringsAndValues(template.strings, template.values)
    : template) as MsgFn;
