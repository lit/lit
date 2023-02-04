/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {installWindowOnGlobal, getWindow} from '../../lib/dom-shim.js';
import {test} from 'uvu';
// eslint-disable-next-line import/extensions
import * as assert from 'uvu/assert';

function testWithHtmlElement(HTMLElement: any) {
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
    assert.is(shadow.host, element);
  });
  test('elements defined with a closed shadow root should expose a null value from the "shadowRoot" property', () => {
    class ClosedShadowRoot extends HTMLElement {}
    const element = new ClosedShadowRoot();
    element.attachShadow({mode: 'closed'});
    assert.is(element.shadowRoot, null);
  });

  test.run();
}

function testWithGlobalShim() {
  installWindowOnGlobal({});
  const {HTMLElement} = globalThis;
  testWithHtmlElement(HTMLElement);
}
function testWithWindow() {
  const window = getWindow({});
  const {HTMLElement} = window;
  testWithHtmlElement(HTMLElement);
}

testWithWindow();
testWithGlobalShim();
