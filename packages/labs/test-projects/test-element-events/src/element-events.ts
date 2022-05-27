/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {LitElement, html, css} from 'lit';
import {customElement, property} from 'lit/decorators.js';

class EventSubclass extends Event {
  aStr: string;
  aNumber: number;

  constructor(
    type = 'event-subclass',
    options = {composed: true, bubbles: true, cancelable: true},
    aStr = 'aStr',
    aNumber = 5
  ) {
    super(type, options);
    this.aStr = aStr;
    this.aNumber = aNumber;
  }
}

/**
 * My awesome element
 * @fires string-custom-event A custom event with a string payload
 * @fires number-custom-event A custom event with a number payload
 * @fires event-subclass - The b changed event with a number payload
 */
@customElement('element-events')
export class ElementEvents extends LitElement {
  static override styles = css`
    :host {
      display: block;
    }
  `;

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
}
