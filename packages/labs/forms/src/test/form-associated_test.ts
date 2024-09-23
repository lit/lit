/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {assert} from 'chai';
import {LitElement, type TemplateResult, render} from 'lit';
import {html, unsafeStatic} from 'lit/static-html.js';
import {ref, createRef} from 'lit/directives/ref.js';
import {
  FormAssociated,
  formValue,
  getInternals,
  isDisabled,
} from '../form-associated.js';

let count = 0;
export const generateElementName = () => `x-${count++}`;

// MARK: Test Classes

/**
 * Basic test element with a validity check.
 */
class TestElement extends FormAssociated(LitElement) {
  static tagName = generateElementName();

  _internals = getInternals(TestElement, this);

  @formValue()
  accessor value = '';

  override _getValidity() {
    if (this.value === 'invalid') {
      return {
        flags: {customError: true},
        message: 'Invalid value',
      };
    }
    return {flags: {}};
  }

  override render(): TemplateResult {
    return html`<input />`;
  }
}
customElements.define(TestElement.tagName, TestElement);
const testElementTag = unsafeStatic(TestElement.tagName);

/**
 * Test element with a custom role.
 */
class CustomRoleElement extends FormAssociated(LitElement) {
  static tagName = generateElementName();

  static override role = 'button';

  _internals = getInternals(CustomRoleElement, this);
}
customElements.define(CustomRoleElement.tagName, CustomRoleElement);

/**
 * Test element that is initially invalid.
 */
class InitiallyInvalidElement extends FormAssociated(LitElement) {
  static tagName = generateElementName();

  _internals = getInternals(InitiallyInvalidElement, this);

  constructor() {
    super();
    this._validate();
  }

  override _getValidity() {
    return {
      flags: {valueMissing: true},
      message: 'Required value',
    };
  }
}
customElements.define(InitiallyInvalidElement.tagName, InitiallyInvalidElement);

/**
 * Test element with an invalid value type.
 */
class InvalidValueTypeElement extends FormAssociated(LitElement) {
  static tagName = generateElementName();

  _internals = getInternals(InvalidValueTypeElement, this);

  // @ts-expect-error value is not a FormValue
  @formValue()
  accessor value = 23;
}
customElements.define(InvalidValueTypeElement.tagName, InvalidValueTypeElement);

/**
 * Test element with a custom form value converter.
 */
class CustomConverterElement extends FormAssociated(LitElement) {
  static tagName = generateElementName();

  _internals = getInternals(CustomConverterElement, this);

  @formValue({
    converter: {
      toFormValue(value: number) {
        return String(value);
      },
      fromFormValue(value: string) {
        return Number(value);
      },
    },
  })
  accessor value = 23;
}
customElements.define(CustomConverterElement.tagName, CustomConverterElement);
const customConverterTag = unsafeStatic(CustomConverterElement.tagName);

// MARK: Tests

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
    assert.isOk(elementRef.value?._internals.form);
  });

  test('has a form value', async () => {
    const formRef = createRef<HTMLFormElement>();
    render(
      html`
        <form ${ref(formRef)}>
          <${testElementTag} .value=${'bar'} name="foo"></${testElementTag}>
        </form>`,
      container
    );
    const formData = new FormData(formRef.value!);
    assert.equal(formData.get('foo'), 'bar');
  });

  test('converts the form value to the form', async () => {
    const elementRef = createRef<CustomConverterElement>();
    const formRef = createRef<HTMLFormElement>();
    render(
      html`
        <form ${ref(formRef)}>
          <${customConverterTag}
            .value=${123}
            name="foo"
            ${ref(elementRef)}>
          </${customConverterTag}>
        </form>`,
      container
    );
    const formData = new FormData(formRef.value!);
    assert.strictEqual(formData.get('foo'), '123');

    const el = elementRef.value!;
    assert.strictEqual(el.value, 123);
  });

  test('can be initially invalid', async () => {
    const el = new InitiallyInvalidElement();
    assert.isFalse(el._internals.checkValidity());
  });

  test('validates', async () => {
    const elementRef = createRef<TestElement>();
    render(
      html`
        <form>
          <${testElementTag}
            .value=${'bar'}
            name="foo"
            ${ref(elementRef)}></${testElementTag}>
        </form>`,
      container
    );
    const el = elementRef.value!;
    assert.isTrue(el._internals.checkValidity());

    el.value = 'invalid';
    assert.isFalse(el._internals.checkValidity());
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
    assert.isTrue(el.matches(':disabled'));
    assert.isTrue(isDisabled(el));

    const fieldSet = fieldSetRef.value!;
    fieldSet.disabled = false;
    assert.isFalse(el.matches(':disabled'));
    assert.isFalse(isDisabled(el));
  });

  test('can be reset', async () => {
    const formRef = createRef<HTMLFormElement>();
    render(
      html`
        <form ${ref(formRef)}>
          <${testElementTag} .value=${'bar'} name="foo"></${testElementTag}>
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
