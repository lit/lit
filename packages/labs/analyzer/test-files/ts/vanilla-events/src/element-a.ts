/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

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
 * @fires typed-event-two {MouseEvent} This is a typed event
 * @fires typed-event-three {MouseEvent} - This is another typed event
 * @fires external-custom-event {ExternalCustomEvent} - External custom event
 * @fires local-custom-event {LocalCustomEvent} - Local custom event
 * @fires generic-custom-event {CustomEvent<ExternalClass>} - Local custom event
 * @fires inline-detail-custom-event {CustomEvent<{ event: MouseEvent; more: { impl: ExternalClass; }; }>}
 *
 * @comment malformed fires tag:
 *
 * @fires
 */
export class ElementA extends HTMLElement {
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

customElements.define('element-a', ElementA);
