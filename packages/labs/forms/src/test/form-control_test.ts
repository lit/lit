/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {assert} from 'chai';
import {LitElement, render} from 'lit';
import {createRef, ref} from 'lit/directives/ref.js';
import {html, unsafeStatic} from 'lit/static-html.js';
import {formValue, getInternals, isDisabled} from '../form-associated.js';
import {FormControl} from '../form-control.js';

let count = 0;
export const generateElementName = () => `x-${count++}`;

// MARK: Test Classes

/**
 * Basic test element with a validity check.
 */
class TestElement extends FormControl(LitElement) {
  static tagName = generateElementName();

  _internals = getInternals(TestElement, this);

  @formValue()
  accessor value = '';
}
customElements.define(TestElement.tagName, TestElement);
const testElementTag = unsafeStatic(TestElement.tagName);

// MARK: Tests

suite('FormControl', () => {
  let container: HTMLElement;

  setup(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  teardown(() => {
    document.body.removeChild(container);
  });

  test('is form-associated', async () => {
    assert.strictEqual(TestElement.formAssociated, true);
  });

  test('has an associated form', async () => {
    const elementRef = createRef<TestElement>();
    render(
      html`
        <form>
          <${testElementTag} ${ref(elementRef)}></${testElementTag}>
        </form>`,
      container
    );
    assert.isOk(elementRef.value?._internals.form);
  });

  test('can be disabled', async () => {
    const elementRef = createRef<TestElement>();
    const fieldSetRef = createRef<HTMLFieldSetElement>();

    render(
      html`
        <form>
          <fieldset disabled ${ref(fieldSetRef)}>
            <${testElementTag} ${ref(elementRef)}></${testElementTag}>
          </fieldset>
        </form>`,
      container
    );

    // Initial state: fieldset disabled, no disabled attribute on element
    const el = elementRef.value!;
    assert.isTrue(el.matches(':disabled'));
    assert.isTrue(isDisabled(el));

    // Un-disable the fieldset
    const fieldSet = fieldSetRef.value!;
    fieldSet.disabled = false;
    assert.isFalse(el.matches(':disabled'));
    assert.isFalse(isDisabled(el));

    // Disable the element
    el.disabled = true;
    assert.isTrue(el.matches(':disabled'));
    assert.isTrue(isDisabled(el));

    // Disable the fieldset
    fieldSet.disabled = true;
    assert.isTrue(el.matches(':disabled'));
    assert.isTrue(isDisabled(el));

    // Un-disable the element
    el.disabled = false;
    assert.isTrue(el.matches(':disabled'));
    assert.isTrue(isDisabled(el));
  });
});
