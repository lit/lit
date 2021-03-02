/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {customElement} from '../../decorators/custom-element.js';
import {generateElementName} from '../test-helpers.js';
import {assert} from '@esm-bundle/chai';

suite('@customElement', () => {
  test('defines an element', () => {
    const tagName = generateElementName();
    @customElement(tagName)
    class C0 extends HTMLElement {}
    const DefinedC = customElements.get(tagName);
    assert.strictEqual(DefinedC, C0);
  });
});
