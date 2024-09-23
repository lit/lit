/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {type ReactiveElement} from '@lit/reactive-element';
import {FormAssociated, getInternals} from './form-associated.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Constructor<T = object> = new (...args: any[]) => T;

/**
 * Generates a public interface type that removes private and protected fields.
 * This allows accepting otherwise incompatible versions of the type (e.g. from
 * multiple copies of the same package in `node_modules`).
 */
type Interface<T> = {
  [K in keyof T]: T[K];
};

interface FormControl extends ReactiveElement {}

/**
 * A mixin that makes a ReactiveElement into a form-associated custom element
 * and adds form-related properties and methods.
 */
export const FormControl = <T extends Constructor<ReactiveElement>>(
  base: T
) => {
  class C extends FormAssociated(base) {
    #internals = getInternals(C, this);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    constructor(...args: any[]) {
      super(...args);
      this.disabled = false;
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
  return C as Constructor<Interface<FormControl>> & T;
};
