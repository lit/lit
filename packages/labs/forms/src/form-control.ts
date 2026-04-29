/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {type ReactiveElement} from '@lit/reactive-element';
import {property} from '@lit/reactive-element/decorators/property.js';
import {FormAssociated} from './form-associated.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Constructor<T = object> = new (...args: any[]) => T;

export interface FormControl extends FormAssociated {
  get form(): HTMLFormElement | null;
  get labels(): NodeList;
  name: string;
  disabled: boolean;
  get validity(): ValidityState;
  get validationMessage(): string;
  get willValidate(): boolean;
  checkValidity(): boolean;
  reportValidity(): boolean;
}

// This should extends FormAssociatedConstructor, but that causes a type error
// due to different constructor return types.
export interface FormControlConstructor {
  role?: ElementInternals['role'];

  formAssociated: true;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  new (...args: any[]): FormControl;
}

/**
 * A mixin that makes a ReactiveElement into a form-associated custom element
 * and adds form-related properties and methods.
 */
export const FormControl = <T extends Constructor<ReactiveElement>>(
  base: T
) => {
  class C extends FormAssociated(base) implements FormControl {
    @property({reflect: true})
    accessor name = '';

    // This must be a `super` call
    #internals = super.attachInternals();
    #attachInternalsCalled = false;

    override attachInternals(): ElementInternals {
      if (this.#attachInternalsCalled) {
        // Call super.attachInternals() if attachInternals has already been
        // called to provoke the native error.
        super.attachInternals();
      }
      this.#attachInternalsCalled = true;
      return this.#internals;
    }

    /**
     * Returns the form owner of the element.
     */
    get form() {
      return this.#internals.form;
    }

    /**
     * Returns the labels associated with the element.
     */
    get labels() {
      return this.#internals.labels;
    }

    /**
     * Reflects the `disabled` attribute, which indicates whether the control is
     * disabled.
     *
     * Note that an element can be disabled either by setting its own `disabled`
     * attribute, or by having a parent `<fieldset>` element that is disabled.
     * In the latter case, this property will return `false`, but the element
     * will still match the `:disabled` CSS pseudo-class. Use the `isDisabled()`
     * utility function to check for disabled state in both cases.
     */
    get disabled() {
      return this.hasAttribute('disabled');
    }

    set disabled(value: boolean) {
      this.toggleAttribute('disabled', value);
    }

    /**
     * Returns the ValidityState object for the element.
     */
    get validity() {
      return this.#internals.validity;
    }

    /**
     * Returns the error message that would be shown to the user if the element
     * was to be checked for validity.
     */
    get validationMessage() {
      return this.#internals.validationMessage;
    }

    /**
     * Returns true if the element is a submittable element that is a candidate
     * for [constraint
     * validation](https://developer.mozilla.org/en-US/docs/Web/HTML/Guides/Constraint_validation).
     *
     * Elements that are barred from being candidates for constraint validation
     * include those that have the attributes: disabled, hidden or readonly,
     * input elements of type=button or type=reset, or any element that is a
     * <datalist> element or has a <datalist> element ancestor.
     */
    get willValidate() {
      return this.#internals.willValidate;
    }

    /**
     * Returns a boolean value which indicates if the element meets any
     * constraint validation rules applied to it.
     *
     * If false, the method also fires an `invalid` event on the element.
     */
    checkValidity() {
      return this.#internals.checkValidity();
    }

    /**
     * Returns a boolean value which indicates if the element meets any
     * constraint validation rules applied to it.
     *
     * If false, the method also fires a cancelable `invalid` event at the
     * element. If the event isn't canceled reports the problem to the user.
     */
    reportValidity() {
      return this.#internals.reportValidity();
    }
  }
  return C as Constructor<FormControl> & T & FormControlConstructor;
};
