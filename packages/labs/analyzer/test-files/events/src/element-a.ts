/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {LitElement} from 'lit';
import {customElement} from 'lit/decorators.js';

/**
 * A cool custom element.
 *
 * @fires event
 * @fires event-two This is an event
 * @fires event-three - This is another event
 * @fires typed-event {MouseEvent}
 * @fires typed-event-two {MouseEvent} This is a typed event
 * @fires typed-event-three {MouseEvent} - This is another typed event
 *
 * @comment malformed fires tag:
 *
 * @fires
 */
@customElement('element-a')
export class ElementA extends LitElement {}
