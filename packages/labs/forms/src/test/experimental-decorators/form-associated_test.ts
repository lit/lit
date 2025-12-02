/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {LitElement} from 'lit';
import {
  FormAssociated,
  formValue,
  formState,
  formStateGetter,
  formStateSetter,
} from '../../form-associated.js';
import {assert} from 'chai';

let count = 0;
const generateElementName = () => `x-experimental-${count++}`;

suite('FormAssociated experimental decorators', () => {
  test('@formValue', () => {
    class TestElement extends FormAssociated(LitElement) {
      static tagName = generateElementName();

      _internals = this.attachInternals();

      @formValue()
      accessor value = 'foo';
    }
    customElements.define(TestElement.tagName, TestElement);

    const el = new TestElement();
    assert.equal(el.value, 'foo');
  });

  test('can be reset', async () => {
    class TestElement extends FormAssociated(LitElement) {
      static tagName = generateElementName();
      _internals = this.attachInternals();

      @formValue()
      accessor value = 'foo';
    }
    customElements.define(TestElement.tagName, TestElement);

    const form = document.createElement('form');
    document.body.appendChild(form);
    const el = new TestElement();
    el.setAttribute('name', 'foo');
    form.appendChild(el);

    assert.equal(el.value, 'foo');

    el.value = 'bar';
    assert.equal(el.value, 'bar');

    form.reset();
    assert.equal(el.value, 'foo');

    document.body.removeChild(form);
  });

  test('@formState', () => {
    class TestElement extends FormAssociated(LitElement) {
      static tagName = generateElementName();

      _internals = this.attachInternals();

      @formValue()
      accessor value = 'foo';

      @formState()
      accessor state = 'bar';

      validateCalled = 0;

      override _validate() {
        this.validateCalled++;
        return super._validate();
      }
    }
    customElements.define(TestElement.tagName, TestElement);

    const el = new TestElement();
    document.body.appendChild(el);

    assert.equal(el.validateCalled, 0);

    el.state = 'baz';
    assert.equal(el.validateCalled, 1);

    document.body.removeChild(el);
  });

  test('@formState on setter', () => {
    class TestElement extends FormAssociated(LitElement) {
      static tagName = generateElementName();
      _internals = this.attachInternals();

      @formValue()
      accessor value = 'foo';

      _state = 'bar';

      @formState()
      set state(v: string) {
        this._state = v;
      }

      get state() {
        return this._state;
      }

      validateCalled = 0;

      override _validate() {
        this.validateCalled++;
        return super._validate();
      }
    }
    customElements.define(TestElement.tagName, TestElement);

    const el = new TestElement();
    document.body.appendChild(el);

    assert.equal(el.validateCalled, 0);

    el.state = 'baz';
    assert.equal(el.validateCalled, 1);

    document.body.removeChild(el);
  });

  test('@formStateGetter and @formStateSetter', () => {
    class TestElement extends FormAssociated(LitElement) {
      static tagName = generateElementName();
      _internals = this.attachInternals();

      @formValue()
      accessor value = 'foo';

      _state = 'bar';

      @formStateSetter()
      setState(v: string) {
        this._state = v;
        const [value] = v.split('#');
        this.value = value;
      }

      @formStateGetter()
      getState() {
        return this._state;
      }
    }
    customElements.define(TestElement.tagName, TestElement);

    const el = new TestElement();
    document.body.appendChild(el);

    // Test getter
    // We can't easily test the getter directly as it's used by internals.setFormValue
    // But we can check if setFormValue was called with the correct state.
    // However, we don't have easy access to internals or spy on it here without more setup.

    // Test setter via formStateRestoreCallback
    // This simulates the browser restoring state

    (el as any).formStateRestoreCallback('baz#1', 'restore');
    assert.equal(el.value, 'baz');
    assert.equal(el.getState(), 'baz#1');

    document.body.removeChild(el);
  });

  test('@formValue with accessor keyword', () => {
    class TestElement extends FormAssociated(LitElement) {
      static tagName = generateElementName();
      _internals = this.attachInternals();

      @formValue()
      accessor value = 'foo';
    }
    customElements.define(TestElement.tagName, TestElement);

    const el = new TestElement();
    assert.equal(el.value, 'foo');

    el.value = 'bar';
    assert.equal(el.value, 'bar');
  });

  test('@formValue accessor', () => {
    class TestElement extends FormAssociated(LitElement) {
      static tagName = generateElementName();
      _internals = this.attachInternals();

      @formValue()
      accessor value = 'foo';
    }
    customElements.define(TestElement.tagName, TestElement);

    const form = document.createElement('form');
    document.body.appendChild(form);

    const el = new TestElement();
    form.appendChild(el);

    assert.equal(el.value, 'foo');

    el.value = 'bar';
    assert.equal(el.value, 'bar');

    form.reset();
    assert.equal(el.value, 'foo');

    document.body.removeChild(form);
  });

  test('@formState accessor', () => {
    class TestElement extends FormAssociated(LitElement) {
      static tagName = generateElementName();
      _internals = this.attachInternals();

      @formValue()
      accessor value = 'foo';

      @formState()
      accessor state = 'bar';

      validateCalled = 0;

      override _validate() {
        this.validateCalled++;
        return super._validate();
      }
    }
    customElements.define(TestElement.tagName, TestElement);

    const el = new TestElement();
    document.body.appendChild(el);

    assert.equal(el.validateCalled, 0);

    el.state = 'baz';
    assert.equal(el.validateCalled, 1);
    assert.equal(el.state, 'baz');

    const form = document.createElement('form');
    document.body.appendChild(form);
    form.appendChild(el);

    form.reset();
    assert.equal(el.state, 'bar');

    document.body.removeChild(form);
  });
});
