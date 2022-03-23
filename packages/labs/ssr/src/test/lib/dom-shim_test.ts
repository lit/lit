/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {getWindow} from '../../lib/dom-shim.js';
import {test} from 'uvu';
import * as assert from 'uvu/assert';

const window = getWindow({}) as unknown as Window;
const {HTMLElement} = window.window;

test('elements without an attached shadow root should expose a null value from the "shadowRoot" property', () => {
  class UnattachedShadowRoot extends HTMLElement {}
  const element = new UnattachedShadowRoot();
  assert.is(element.shadowRoot, null);
});
test('elements defined with an open shadow root should expose it\'s shadow root from the "shadowRoot" property', () => {
  class OpenShadowRoot extends HTMLElement {}
  const element = new OpenShadowRoot();
  const shadow = element.attachShadow({mode: 'open'});
  assert.is(shadow, element.shadowRoot);
});
test('elements defined with a closed shadow root should expose a null value from the "shadowRoot" property', () => {
  class ClosedShadowRoot extends HTMLElement {}
  const element = new ClosedShadowRoot();
  element.attachShadow({mode: 'closed'});
  assert.is(element.shadowRoot, null);
});

test.run();
