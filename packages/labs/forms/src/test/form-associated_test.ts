/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {assert} from 'chai';
import {LitElement, type TemplateResult, render} from 'lit';
import {html, unsafeStatic} from 'lit/static-html.js';
import {ref, createRef} from 'lit/directives/ref.js';
import {property} from 'lit/decorators.js';
import {
  FormAssociated,
  formValue,
  getInternals,
  isDisabled,
} from '../form-associated.js';

let count = 0;
export const generateElementName = () => `x-${count++}`;

class TestElement extends FormAssociated(LitElement) {
  static tagName = generateElementName();

  @formValue()
  @property()
  accessor value = '';

  _internals = getInternals(TestElement, this);

  get _form() {
    return this._internals?.form;
  }

  override render(): TemplateResult {
    return html`<input />`;
  }
}
customElements.define(TestElement.tagName, TestElement);
const testElementTag = unsafeStatic(TestElement.tagName);

class CustomRoleElement extends FormAssociated(LitElement) {
  static tagName = generateElementName();

  static override role = 'button';

  _internals = getInternals(CustomRoleElement, this);
}
customElements.define(CustomRoleElement.tagName, CustomRoleElement);

suite('FormAssociated', () => {
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
    assert.isOk(elementRef.value?._form);
  });

  test('has a form value', async () => {
    const formRef = createRef<HTMLFormElement>();
    render(
      html`
        <form ${ref(formRef)}>
          <${testElementTag} value="bar" name="foo"></${testElementTag}>
        </form>`,
      container
    );
    const formData = new FormData(formRef.value!);
    assert.equal(formData.get('foo'), 'bar');
  });

  test('sets the role on internals', () => {
    // TODO (justinfagnani): Can we check actual role?
    const el = new TestElement();
    assert.equal(el._internals.role, null);

    const customRoleEl = new CustomRoleElement();
    assert.equal(customRoleEl._internals.role, 'button');
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
    const el = elementRef.value!;
    assert.equal(el.matches(':disabled'), true);
    assert.equal(isDisabled(el), true);

    const fieldSet = fieldSetRef.value!;
    fieldSet.disabled = false;
    assert.equal(el.matches(':disabled'), false);
    assert.equal(isDisabled(el), false);
  });

  test('can be reset', async () => {
    const formRef = createRef<HTMLFormElement>();
    render(
      html`
        <form ${ref(formRef)}>
          <${testElementTag} value="bar" name="foo"></${testElementTag}>
        </form>`,
      container
    );
    const form = formRef.value!;
    let formData = new FormData(form);
    assert.equal(formData.get('foo'), 'bar');

    form.reset();
    formData = new FormData(form);
    assert.equal(formData.get('foo'), '');
  });

  test('getInternals can only be called once', async () => {
    const el = new TestElement();
    assert.throws(() => getInternals(TestElement, el));
  });

  test('getInternals can not be called with a random ctor', async () => {
    const el = new TestElement();
    class RandomCtor extends FormAssociated(LitElement) {}
    assert.throws(() => getInternals(RandomCtor, el));
  });

  // TODO (justinfagnani): How can we test form state restoration and
  // autocomplete?
});
