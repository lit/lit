/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {LitElement, html, TemplateResult} from 'lit';
import {customElement, property} from 'lit/decorators.js';
import {SpecialEvent} from './special-event.js';
import {MyDetail} from './detail-type.js';

export {SpecialEvent} from './special-event.js';
export {MyDetail} from './detail-type.js';
export class EventSubclass extends Event {
  aStr: string;
  aNumber: number;

  constructor(
    aStr = 'aStr',
    aNumber = 5,
    type = 'event-subclass',
    options = {composed: true, bubbles: true, cancelable: true}
  ) {
    super(type, options);
    this.aStr = aStr;
    this.aNumber = aNumber;
  }
}

declare global {
  interface HTMLElementEventMap {
    'event-subclass': EventSubclass;
    'special-event': SpecialEvent;
    'string-custom-event': CustomEvent<string>;
    'number-custom-event': CustomEvent<number>;
    'my-detail-custom-event': CustomEvent<MyDetail>;
    'template-result-custom-event': CustomEvent<TemplateResult>;
  }
}

/**
 * My awesome element
 * @fires string-custom-event {CustomEvent<string>} A custom event with a string payload
 * @fires number-custom-event {CustomEvent<number>} A custom event with a number payload
 * @fires my-detail-custom-event {CustomEvent<MyDetail>} A custom event with a MyDetail payload.
 * @fires event-subclass {EventSubclass} The subclass event with a string and number payload
 * @fires special-event {SpecialEvent} The special event with a number payload
 * @fires template-result-custom-event {CustomEvent<TemplateResult>} The result-custom-event with a TemplateResult payload.
 */
@customElement('element-events')
export class ElementEvents extends LitElement {
  @property()
  foo?: string;

  override render() {
    return html`<h1>${this.foo}</h1>`;
  }

  fireStringCustomEvent(detail = 'string-event', fromNode = this) {
    fromNode.dispatchEvent(
      new CustomEvent('string-custom-event', {
        detail,
        bubbles: true,
        composed: true,
        cancelable: true,
      })
    );
  }

  fireNumberCustomEvent(detail = 11, fromNode = this) {
    fromNode.dispatchEvent(
      new CustomEvent('number-custom-event', {
        detail,
        bubbles: true,
        composed: true,
        cancelable: true,
      })
    );
  }

  fireMyDetailCustomEvent(
    detail = {a: 'a', b: 5} as MyDetail,
    fromNode = this
  ) {
    fromNode.dispatchEvent(
      new CustomEvent<MyDetail>('my-detail-custom-event', {
        detail,
        bubbles: true,
        composed: true,
        cancelable: true,
      })
    );
  }

  fireTemplateResultCustomEvent(detail = html``, fromNode = this) {
    fromNode.dispatchEvent(
      new CustomEvent('template-result-custom-event', {
        detail,
        bubbles: true,
        composed: true,
        cancelable: true,
      })
    );
  }

  fireEventSubclass(str: string, num: number, fromNode = this) {
    fromNode.dispatchEvent(new EventSubclass(str, num));
  }

  fireSpecialEvent(num: number, fromNode = this) {
    fromNode.dispatchEvent(new SpecialEvent(num));
  }
}
