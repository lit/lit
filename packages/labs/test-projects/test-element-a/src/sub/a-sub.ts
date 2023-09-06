/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {customElement, property} from 'lit/decorators.js';
import {ElementA} from '../element-a.js';

/**
 * This is a description of my subclass.
 * @summary My subclassed element
 */
@customElement('a-sub')
export class ASub extends ElementA {
  @property()
  bar?: string;
}
