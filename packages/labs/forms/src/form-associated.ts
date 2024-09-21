/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {type ReactiveElement} from '@lit/reactive-element';

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

interface FormAssociated extends ReactiveElement {
  _checkValidity?(): ValidityResult;
}

interface FormAssociatedConstructor {
  [Symbol.metadata]: object & Record<PropertyKey, unknown>;
  new (): FormAssociated;
}

interface ValidityResult {
  flags: ValidityState;
  message?: string;
  anchor?: HTMLElement;
}

const internals = new WeakMap<FormAssociated, ElementInternals>();

/**
 * Returns the ElementInternals for a FormAssociated element. This should only
 * be called by subclasses of FormAssociated.
 */
export const getInternals = (element: FormAssociated) => internals.get(element);

/**
 * Returns true if the element is disabled.
 */
export const isDisabled = (element: FormAssociated) =>
  disabledElements.has(element);

const disabledElements = new WeakSet<FormAssociated>();

export const FormAssociated = <T extends Constructor<ReactiveElement>>(
  base: T
) => {
  class C extends base {
    #internals: ElementInternals;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    constructor(...args: any[]) {
      super(...args);
      this.#internals = this.attachInternals();
      internals.set(this, this.#internals);
    }

    formDisabledCallback(disabled: boolean) {
      if (disabled) {
        disabledElements.add(this);
      } else {
        disabledElements.delete(this);
      }
      this.#internals.ariaDisabled = String(disabled);
      this.requestUpdate();
    }

    formResetCallback() {
      const metadata = (this.constructor as FormAssociatedConstructor)[
        Symbol.metadata
      ];

      // Restore the initial value
      const valueAccess = valueAccessors.get(metadata);
      const initialValue = initialValues.get(this);
      valueAccess?.set(this, initialValue);

      // Restore the initial state
      const stateAccess = stateAccessors.get(metadata);
      const initialState = initialStates.get(this);
      stateAccess?.set(this, initialState);
    }

    formStateRestoreCallback(
      state: string | File | FormData | null,
      mode: 'restore' | 'autocomplete'
    ) {
      const metadata = (this.constructor as FormAssociatedConstructor)[
        Symbol.metadata
      ];
      if (mode === 'restore') {
        // When restoring a value we should get the state previously passed to
        // internals.setFormValue(). We can pass that to the state accessor,
        // which should update the value accessor.
        // If there is no state accessor, we should update the value accessor
        const stateAccess = stateAccessors.get(metadata);
        if (stateAccess !== undefined) {
          stateAccess.set(this, state);
        } else {
          const valueAccess = valueAccessors.get(metadata);
          valueAccess?.set(this, state);
        }
      } else if (mode === 'autocomplete') {
        // When autocompleting a value, we don't get a previous state object, so
        // we should update the value accessor directly.
        const valueAccess = valueAccessors.get(metadata);
        valueAccess?.set(this, state);
      }
    }
  }
  return C as Constructor<Interface<FormAssociated>> & T;
};

type Access = ClassAccessorDecoratorContext<FormAssociated, unknown>['access'];

const valueAccessors = new WeakMap<DecoratorMetadataObject, Access>();

/*
 * A store of initial values for FormAssociated elements so that they can be
 * restored when the form is reset.
 */
const initialValues = new WeakMap<FormAssociated, unknown>();

/**
 * A class accessor decorator that marks a field as the form value for the
 * FormAssociated mixin.
 */
export const formValue =
  () =>
  <V extends string | File | FormData | null>(
    target: ClassAccessorDecoratorTarget<FormAssociated, V>,
    context: ClassAccessorDecoratorContext<FormAssociated, V>
  ): ClassAccessorDecoratorResult<FormAssociated, V> => {
    valueAccessors.set(context.metadata, context.access);

    return {
      get: target.get,
      set(value: V) {
        target.set.call(this, value);
        getInternals(this)!.setFormValue(value);
      },
      init(value: V) {
        initialValues.set(this, value);
        return value;
      },
    };
  };

const stateAccessors = new WeakMap<DecoratorMetadataObject, Access>();

/*
 * A store of initial values for FormAssociated elements so that they can be
 * restored when the form is reset.
 */
const initialStates = new WeakMap<FormAssociated, unknown>();

/**
 * A class accessor decorator that marks a field as the form state for the
 * FormAssociated mixin.
 *
 * This accessor should be private. The setter should only be called by the
 * FormAssociated mixin, not by the elemen itself.
 */
export const formState =
  () =>
  <V extends string | File | FormData | null>(
    target: ClassAccessorDecoratorTarget<FormAssociated, V>,
    context: ClassAccessorDecoratorContext<FormAssociated, V>
  ): ClassAccessorDecoratorResult<FormAssociated, V> => {
    stateAccessors.set(context.metadata, context.access);

    return {
      get: target.get,
      set(value: V) {
        target.set.call(this, value);
      },
      init(value: V) {
        initialStates.set(this, value);
        return value;
      },
    };
  };
