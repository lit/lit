/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {directive} from 'lit/directive.js';
import {getDirectiveClass} from 'lit/directive-helpers.js';
import {UntilDirective} from 'lit/directives/until.js';

class ServerUntilDirective extends UntilDirective {
  static $litServerUntil = true;
}

/**
 */
export const serverUntil = directive(ServerUntilDirective);

export const isServerUntilDirective = (value: unknown): boolean =>
  (getDirectiveClass(value) as typeof ServerUntilDirective)?.$litServerUntil;
