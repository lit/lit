/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {suite} from 'uvu';
// eslint-disable-next-line import/extensions
import * as assert from 'uvu/assert';
import {customElements, HTMLElement} from '@lit-labs/ssr-dom-shim';

const test = suite('Element Shim');

test('toggleAttribute adds and removes attributes', () => {
  const shimmedEl = new HTMLElement();
  assert.ok(shimmedEl.toggleAttribute('potato'));
  assert.ok(shimmedEl.hasAttribute('potato'));
  assert.not.ok(shimmedEl.toggleAttribute('potato'));
  assert.not.ok(shimmedEl.hasAttribute('potato'));
});

test('toggleAttribute accepts an optional force parameter', () => {
  const shimmedEl = new HTMLElement();
  assert.not.ok(shimmedEl.toggleAttribute('potato', false));
  assert.not.ok(shimmedEl.hasAttribute('potato'));
  assert.ok(shimmedEl.toggleAttribute('potato', true));
  assert.ok(shimmedEl.hasAttribute('potato'));
  // A no-op, ensuring attribute remains
  assert.ok(shimmedEl.toggleAttribute('potato', true));
  assert.ok(shimmedEl.hasAttribute('potato'));
});

test('toggleAttribute retains a previously set value if force is true', () => {
  const shimmedEl = new HTMLElement();
  shimmedEl.setAttribute('foo', 'bar');
  assert.ok(shimmedEl.toggleAttribute('foo', true));
  assert.equal(shimmedEl.getAttribute('foo'), 'bar');
});

test('setAttribute silently casts values to a string', () => {
  const shimmedEl = new HTMLElement();
  // It is possible to pass any value to `setAttribute`, and we
  // silently convert it to a string.
  shimmedEl.setAttribute('tomato', {} as unknown as string);
  assert.equal(shimmedEl.getAttribute('tomato'), '[object Object]');
});

test('localName and tagName should be available', () => {
  const elementName = 'lit-test';
  customElements.define(elementName, class extends HTMLElement {});
  const LitTest = customElements.get(elementName)!;
  const shimmedEl = new LitTest();
  assert.equal(shimmedEl.localName, elementName);
  assert.equal(shimmedEl.tagName, elementName.toUpperCase());
});

test.run();
