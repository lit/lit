/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

// This file will be loaded by Node from the node:test script to verify that all
// exports of this package can be imported without crashing in Node.

import 'lit-element';
import 'lit-element/private-ssr-support.js';
import 'lit-element/decorators.js';
import 'lit-element/decorators/custom-element.js';
import 'lit-element/decorators/event-options.js';
import 'lit-element/decorators/state.js';
import 'lit-element/decorators/property.js';
import 'lit-element/decorators/query.js';
import 'lit-element/decorators/query-all.js';
import 'lit-element/decorators/query-assigned-elements.js';
import 'lit-element/decorators/query-assigned-nodes.js';
import 'lit-element/decorators/query-async.js';

import {LitElement, html} from 'lit-element';
import {customElement} from 'lit-element/decorators.js';

@customElement('my-element')
export class MyElement extends LitElement {
  override render() {
    return html`Hello World`;
  }
}

export class MyOtherElement extends LitElement {
  override render() {
    return html`Hello World`;
  }
}
customElements.define('my-other-element', MyOtherElement);
