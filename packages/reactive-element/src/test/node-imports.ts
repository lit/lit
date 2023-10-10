/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

// This file will be loaded by Node from the node:test script to verify that all
// exports of this package can be imported without crashing in Node.

import '@lit/reactive-element';
import '@lit/reactive-element/reactive-controller.js';
import '@lit/reactive-element/css-tag.js';
import '@lit/reactive-element/decorators.js';
import '@lit/reactive-element/decorators/custom-element.js';
import '@lit/reactive-element/decorators/event-options.js';
import '@lit/reactive-element/decorators/state.js';
import '@lit/reactive-element/decorators/property.js';
import '@lit/reactive-element/decorators/query.js';
import '@lit/reactive-element/decorators/query-all.js';
import '@lit/reactive-element/decorators/query-assigned-elements.js';
import '@lit/reactive-element/decorators/query-assigned-nodes.js';
import '@lit/reactive-element/decorators/query-async.js';

import {customElement, property} from '@lit/reactive-element/decorators.js';
import {ReactiveElement, css} from '@lit/reactive-element';

@customElement('my-element')
export class MyElement extends ReactiveElement {
  // Include both static styles and a @property decorator in the test. The
  // @property decorator triggers class initialization, and if there are also
  // static styles, it will trigger an instanceof check for CSSStyleSheet, which
  // could explode if not handled with care in the node build.
  static override styles = css`
    p {
      color: purple;
    }
  `;

  @property()
  name = 'World';
}

export class MyOtherElement extends ReactiveElement {}
customElements.define('my-other-element', MyOtherElement);

import assert from 'node:assert/strict';
import {HTMLElement} from '@lit-labs/ssr-dom-shim';
assert.strictEqual(
  Object.getPrototypeOf(ReactiveElement),
  HTMLElement,
  'Expected ReactiveElement to extend HTMLElement from ssr-dom-shim'
);
