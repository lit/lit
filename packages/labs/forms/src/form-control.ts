/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {type ReactiveElement} from '@lit/reactive-element';
import {FormAssociated} from './form-associated.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Constructor<T = object> = new (...args: any[]) => T;

export interface FormControl extends FormAssociated {
  get form(): HTMLFormElement | null;
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
    // This must be a `super` call
    #internals = super.attachInternals();
    #attachInternalsCalled = false;

    override attachInternals(): ElementInternals {
      if (this.#attachInternalsCalled) {
        throw new Error('attachInternals has already been called');
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

    get disabled() {
      return this.hasAttribute('disabled');
    }

    set disabled(value: boolean) {
      this.toggleAttribute('disabled', value);
    }

    // TODO (justinfagnani): do we need to add `hidden` and `readonly`? Are
    // those attribute respected by forms on FACEs too?

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
     * Returns true if internals's target element will be validated when the
     * form is submitted; false otherwise.
     */
    get willValidate() {
      return this.#internals.willValidate;
    }

    /**
     * Returns true if the element has no validity problems; false otherwise.
     * Fires an invalid event at the element in the latter case.
     */
    checkValidity() {
      return this.#internals.checkValidity();
    }

    /**
     * Returns true if the element has no validity problems; otherwise, returns
     * false, fires an invalid event at the element, and (if the event isn't
     * canceled) reports the problem to the user.
     */
    reportValidity() {
      return this.#internals.reportValidity();
    }
  }
  return C as Constructor<FormControl> & T & FormControlConstructor;
};
