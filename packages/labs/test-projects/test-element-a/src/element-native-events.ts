/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {LitElement, html} from 'lit';
import {customElement, property} from 'lit/decorators.js';

export interface NativeDetail {
  value: number;
}

declare global {
  interface HTMLElementEventMap {
    'value-changed': CustomEvent<NativeDetail>;
  }
}

/**
 * An element that reuses a native event name.
 *
 * `input` is one of the event names Svelte delegates when a handler is bound as
 * an `on<name>={...}` attribute, and these events are dispatched with the
 * default options (`bubbles: false, composed: false`), so a delegated handler
 * listening at the app root never sees them. `value-changed` is the control: it
 * is not a native name, so it is never delegated.
 *
 * @fires input {CustomEvent<NativeDetail>} A non-bubbling event reusing a native event name
 * @fires value-changed {CustomEvent<NativeDetail>} A non-bubbling event with a kebab-case name
 */
@customElement('element-native-events')
export class ElementNativeEvents extends LitElement {
  @property({type: Number})
  value = 0;

  override render() {
    return html`<h1>${this.value}</h1>`;
  }

  fireInput(detail: NativeDetail = {value: 1}) {
    // Default event options: bubbles: false, composed: false.
    this.dispatchEvent(new CustomEvent('input', {detail}));
  }

  fireValueChanged(detail: NativeDetail = {value: 2}) {
    this.dispatchEvent(new CustomEvent('value-changed', {detail}));
  }
}
