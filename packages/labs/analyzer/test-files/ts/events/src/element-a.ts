/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {LitElement} from 'lit';
import {customElement} from 'lit/decorators.js';
import {ExternalCustomEvent, ExternalClass} from './custom-event.js';

export class LocalCustomEvent extends Event {
  message: string;
  constructor(message) {
    super('local-custom-event');
    this.message = message;
  }
}
/**
 * A cool custom element.
 *
 * @fires event
 * @fires event-two This is an event
 * @fires event-three - This is another event
 * @fires typed-event {MouseEvent}
 * @fires {MouseEvent} ordered-typed-event
 * @fires typed-event-two {MouseEvent} This is a typed event
 * @fires {MouseEvent} ordered-typed-event-two This is a typed event
 * @fires typed-event-three {MouseEvent} - This is another typed event
 * @fires {MouseEvent} ordered-typed-event-three - This is another typed event
 * @fires external-custom-event {ExternalCustomEvent} - External custom event
 * @fires {ExternalCustomEvent} ordered-external-custom-event - External custom event
 * @fires local-custom-event {LocalCustomEvent} - Local custom event
 * @fires {LocalCustomEvent} ordered-local-custom-event - Local custom event
 * @fires generic-custom-event {CustomEvent<ExternalClass>} - Generic custom event
 * @fires {CustomEvent<ExternalClass>} ordered-generic-custom-event - Generic custom event
 * @fires inline-detail-custom-event {CustomEvent<{ event: MouseEvent; more: { impl: ExternalClass; }; }>} Inline
 * detail custom event description
 * @fires {CustomEvent<{ event: MouseEvent; more: { impl: ExternalClass; }; }>} ordered-inline-detail-custom-event Inline
 * detail custom event description
 * @comment malformed fires tag:
 *
 * @fires
 */
@customElement('element-a')
export class ElementA extends LitElement {
  fireExternalEvent() {
    this.dispatchEvent(new ExternalCustomEvent('external'));
  }
  fireLocalEvent() {
    this.dispatchEvent(new LocalCustomEvent('local'));
  }
  fireGenericEvent() {
    this.dispatchEvent(
      new CustomEvent<ExternalClass>('generic-custom-event', {
        detail: new ExternalClass(),
      })
    );
  }
}
