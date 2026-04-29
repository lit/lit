/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {suite} from 'uvu';
// eslint-disable-next-line import/extensions
import * as assert from 'uvu/assert';
import {
  customElements,
  document,
  EventTargetShimMeta,
  HTMLElement,
} from '@lit-labs/ssr-dom-shim';

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

test('localName and tagName should be available with constructor from customElements registry', () => {
  const elementName = 'lit-test-registry';
  customElements.define(elementName, class extends HTMLElement {});
  const LitTestRegistry = customElements.get(elementName)!;

  const shimmedEl = new LitTestRegistry();
  assert.equal(shimmedEl.localName, elementName);
  assert.equal(shimmedEl.tagName, elementName.toUpperCase());
});

test('localName and tagName should be available when registering with customElements', () => {
  const elementName = 'lit-test-local';
  class LitTestLocal extends HTMLElement {}
  customElements.define(elementName, LitTestLocal);

  const shimmedEl = new LitTestLocal();
  assert.equal(shimmedEl.localName, elementName);
  assert.equal(shimmedEl.tagName, elementName.toUpperCase());
});

test('localName and tagName usage should return undefined if not registered', () => {
  class LitTestUnregistered extends HTMLElement {}

  const shimmedEl = new LitTestUnregistered();
  assert.equal(shimmedEl.localName, undefined);
  assert.equal(shimmedEl.tagName, undefined);
});

test('getRootNode should return document when not inside a shadow DOM', () => {
  assert.equal(new HTMLElement().getRootNode(), document);
});

test('getRootNode should return the shadow root of the host', () => {
  const host = new HTMLElement();
  host.attachShadow({mode: 'open'});
  const child = new HTMLElement();
  (child as Partial<EventTargetShimMeta>).__host = host;
  assert.equal(child.getRootNode(), host.shadowRoot);
  assert.equal(child.getRootNode({composed: false}), host.shadowRoot);
});

test('getRootNode should return document with composed option', () => {
  const host = new HTMLElement();
  host.attachShadow({mode: 'open'});
  const child = new HTMLElement();
  (child as Partial<EventTargetShimMeta>).__host = host;
  assert.equal(child.getRootNode({composed: true}), document);
});

test('getRootNode should return the shadow root of the host with closed mode', () => {
  const host = new HTMLElement();
  const shadowRoot = host.attachShadow({mode: 'closed'});
  assert.equal(host.shadowRoot, null);
  const child = new HTMLElement();
  (child as Partial<EventTargetShimMeta>).__host = host;
  assert.equal(child.getRootNode(), shadowRoot);
});

test.run();
