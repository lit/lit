/**
 * @license
 * Copyright The Lit Project
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {property} from '@lit/reactive-element/decorators.js';
import {assert} from 'chai';
import {LitElement, type TemplateResult, render} from 'lit';
import {createRef, ref} from 'lit/directives/ref.js';
import {html, unsafeStatic} from 'lit/static-html.js';
import {
  FormAssociated,
  formDefaultValue,
  formState,
  formStateGetter,
  formStateSetter,
  formValue,
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

  _internals = this.attachInternals();

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
 * Test element with user-settable default value.
 */
class DefaultElement extends FormAssociated(LitElement) {
  static tagName = generateElementName();

  _internals = this.attachInternals();

  @formValue()
  accessor value = '';

  @formDefaultValue()
  accessor default = '';
}
customElements.define(DefaultElement.tagName, DefaultElement);
const defaultElementTag = unsafeStatic(DefaultElement.tagName);

/**
 * Test element with a custom role.
 */
class CustomRoleElement extends FormAssociated(LitElement) {
  static tagName = generateElementName();

  static override role = 'button';

  _internals = this.attachInternals();
}
customElements.define(CustomRoleElement.tagName, CustomRoleElement);

/**
 * Test element that is initially invalid.
 */
class InitiallyInvalidElement extends FormAssociated(LitElement) {
  static tagName = generateElementName();

  _internals = this.attachInternals();

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

  _internals = this.attachInternals();

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

  _internals = this.attachInternals();

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

/**
 * Test element with a custom form state accessor.
 */
class CustomStateElement extends FormAssociated(LitElement) {
  static tagName = generateElementName();

  _internals = this.attachInternals();

  @formValue()
  accessor value = 'bar';

  @formState()
  @property()
  accessor count = 0;

  @formStateGetter()
  // @ts-expect-error #formState is called dynamically
  #getFormState() {
    return this.value + '#' + this.count;
  }

  @formStateSetter()
  // @ts-expect-error #setFormState is called dynamically
  #setFormState(state: string) {
    const [value, count] = state.split('#');
    this.value = value;
    this.count = Number(count);
  }
}
customElements.define(CustomStateElement.tagName, CustomStateElement);
const customStateTag = unsafeStatic(CustomStateElement.tagName);

interface FormAssociatedElement extends HTMLElement {
  formStateRestoreCallback(
    state: string | File | FormData | null,
    mode: 'restore' | 'autocomplete'
  ): void;
}

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

  test('can be reset with default', async () => {
    const formRef = createRef<HTMLFormElement>();
    render(
      html`
        <form ${ref(formRef)}>
          <${defaultElementTag}
            .value=${'bar'}
            .default=${'foo'}
            name="foo">
          </${defaultElementTag}>
        </form>`,
      container
    );
    const form = formRef.value!;
    let formData = new FormData(form);
    assert.equal(formData.get('foo'), 'bar');

    form.reset();
    formData = new FormData(form);
    assert.equal(formData.get('foo'), 'foo');
  });

  test('can be restored from state without @formState', async () => {
    const elementRef = createRef<TestElement>();
    const formRef = createRef<HTMLFormElement>();
    render(
      html`
        <form ${ref(formRef)}>
          <${testElementTag}
            .value=${'bar'}
            name="foo"
            ${ref(elementRef)}>
          </${testElementTag}>
        </form>`,
      container
    );
    const el = elementRef.value! as TestElement & FormAssociatedElement;
    const form = formRef.value!;

    // First, set the value so we store a state
    el.value = 'baz';

    // Now, restore the state
    el.formStateRestoreCallback('bar', 'restore');
    assert.equal(el.value, 'bar');
    let formData = new FormData(form);
    assert.equal(formData.get('foo'), 'bar');

    el.formStateRestoreCallback('qux', 'autocomplete');
    assert.equal(el.value, 'qux');
    formData = new FormData(form);
    assert.equal(formData.get('foo'), 'qux');
  });

  test('can be restored from state with @formState', async () => {
    const elementRef = createRef<CustomStateElement>();
    const formRef = createRef<HTMLFormElement>();
    render(
      html`
        <form ${ref(formRef)}>
          <${customStateTag}
            .value=${'bar'}
            name="foo"
            ${ref(elementRef)}>
          </${customStateTag}>
        </form>`,
      container
    );
    const el = elementRef.value! as CustomStateElement & FormAssociatedElement;
    const form = formRef.value!;

    // First, set the value so we store a state
    el.value = 'baz';

    // Now, restore the state
    el.formStateRestoreCallback('bar#0', 'restore');
    assert.equal(el.value, 'bar');
    assert.equal(el.count, 0);
    let formData = new FormData(form);
    assert.equal(formData.get('foo'), 'bar');

    // Restoring with 'autocomplete' should not change the count
    el.count = 3;
    el.formStateRestoreCallback('qux', 'autocomplete');
    assert.equal(el.value, 'qux');
    assert.equal(el.count, 3);
    formData = new FormData(form);
    assert.equal(formData.get('foo'), 'qux');
  });

  test('restoring uses value converter', async () => {
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
    const el = elementRef.value! as CustomConverterElement &
      FormAssociatedElement;
    const form = formRef.value!;

    // First, set the value so we store a state
    el.value = 456;

    // Now, restore the state
    el.formStateRestoreCallback('123', 'restore');
    assert.strictEqual(el.value, 123);
    let formData = new FormData(form);
    assert.equal(formData.get('foo'), '123');

    el.formStateRestoreCallback('789', 'autocomplete');
    assert.equal(el.value, 789);
    formData = new FormData(form);
    assert.equal(formData.get('foo'), '789');
  });

  // TODO (justinfagnani): How can we test form state restoration and
  // autocomplete?
});
