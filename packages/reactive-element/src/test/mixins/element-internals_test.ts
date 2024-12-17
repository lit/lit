/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {ReactiveElement} from '@lit/reactive-element';
import {customElement} from '@lit/reactive-element/decorators/custom-element.js';
import {
  elementInternals,
  ElementInternalsHost,
} from '@lit/reactive-element/mixins/element-internals.js';
import {assert} from 'chai';

@customElement('my-element-without-role')
export class MyElementWithoutRole extends ElementInternalsHost(
  ReactiveElement
) {}
@customElement('my-element-with-role')
export class MyElementWithRole extends ElementInternalsHost(ReactiveElement) {
  static override role = 'button';
}

suite('ElementInternalsHost', () => {
  test('should attach element internals', () => {
    const element = document.createElement(
      'my-element-without-role'
    ) as MyElementWithoutRole;
    assert.strictEqual(
      element[elementInternals].shadowRoot,
      element.shadowRoot
    );
  });
  test('should assign role from static property', () => {
    const element = document.createElement(
      'my-element-with-role'
    ) as MyElementWithRole;
    assert.equal(element[elementInternals].role, MyElementWithRole.role);
  });
});
