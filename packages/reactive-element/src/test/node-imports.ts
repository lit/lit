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
import '@lit/reactive-element/decorators/base.js';
import '@lit/reactive-element/decorators/custom-element.js';
import '@lit/reactive-element/decorators/event-options.js';
import '@lit/reactive-element/decorators/state.js';
import '@lit/reactive-element/decorators/property.js';
import '@lit/reactive-element/decorators/query.js';
import '@lit/reactive-element/decorators/query-all.js';
import '@lit/reactive-element/decorators/query-assigned-elements.js';
import '@lit/reactive-element/decorators/query-assigned-nodes.js';
import '@lit/reactive-element/decorators/query-async.js';

import {customElement} from '@lit/reactive-element/decorators.js';
import {ReactiveElement} from '@lit/reactive-element';

@customElement('my-element')
export class MyElement extends ReactiveElement {}

export class MyOtherElement extends ReactiveElement {}
customElements.define('my-other-element', MyOtherElement);
