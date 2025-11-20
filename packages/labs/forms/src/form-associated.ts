/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {type ReactiveElement} from '@lit/reactive-element';

// #region Types

export interface FormValueOptions<T> {
  converter?: FormValueConverter<T>;
}

interface FormValueConverter<T> {
  toFormValue(v: T): FormValue;
  fromFormValue(v: FormValue): T;
}

export type FormValue = string | File | FormData | null;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Constructor<T = object> = new (...args: any[]) => T;

export interface FormAssociated extends ReactiveElement {
  /**
   * Implement this method to validate the element. Return a `ValidityResult`.
   */
  _getValidity?(): ValidityResult;

  /**
   * Internal method to validate the element. This method should be called by
   * the element when its state might have changed in a way that would affect
   * its validity.
   *
   * Calls `_getValidity` and sets the validity flags on the element's
   * internals, then returns the result of `internals.checkValidity()`.
   *
   * It's often a good idea to call this method in the constructor to set the
   * initial validity state.
   */
  _validate(): boolean;
}

export interface FormAssociatedConstructor {
  role?: ElementInternals['role'];

  formAssociated: true;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  new (...args: any[]): FormAssociated;
}

interface ValidityResult {
  flags: Partial<Omit<ValidityState, 'valid'>>;
  message?: string;
  anchor?: HTMLElement;
}

type Access<T = unknown> = {
  get(obj: FormAssociated): T;
  set(obj: FormAssociated, value: T): void;
};

// #endregion

// #region Shared State

/**
 * Returns an key suitable for storing metadata about the class, either
 * from Symbol.metadata or the constructor itself.
 *
 * In environments with Symbol.metadata support, this will return the metadata
 * object for both standard and experimental decorators. In environments without
 * Symbol.metadata support, this will return the constructor itself as a
 * unique key, but this will only work correctly with experimental decorators.
 */
const getClassKey = (ctor: Function): object => {
  return ctor[Symbol.metadata] ?? ctor;
};

const internalsCache = new WeakMap<FormAssociated, ElementInternals>();

const valueAccessors = new WeakMap<object, Access>();

const defaultValueAccessors = new WeakMap<object, Access>();

const defaultStateAccessors = new WeakMap<object, Access<FormValue>>();

const stateAccessors = new WeakMap<object, Partial<Access<FormValue>>>();

/*
 * A store of initial values for FormAssociated elements so that they can be
 * restored when the form is reset.
 */
const initialValues = new WeakMap<FormAssociated, unknown>();

/*
 * A store of initial values for FormAssociated elements so that they can be
 * restored when the form is reset.
 */
const initialStates = new WeakMap<FormAssociated, FormValue>();

const formValueOptions = new WeakMap<object, FormValueOptions<unknown>>();

const initializeValue = (
  map: WeakMap<FormAssociated, unknown>,
  obj: FormAssociated,
  descriptor: PropertyDescriptor,
  value: unknown
) => {
  if (!map.has(obj)) {
    const currentValue = descriptor.get?.call(obj);
    if (currentValue !== undefined) {
      map.set(obj, currentValue);
    } else {
      map.set(obj, value);
    }
  }
};

// #endregion

// #region Utilities

/**
 * Returns true if the element is disabled.
 */
// TODO (justinfagnani): Make this work in SSR
export const isDisabled = (element: FormAssociated) =>
  element.matches(':disabled');

// #endregion

// #region FormAssociated

/**
 * A mixin that makes a ReactiveElement into a form-associated custom element.
 *
 * - ARIA role: Sets this element's ElementInternals role to the value of the
 *   static `role` property.
 * - Form value: The value of the element is stored in the field decorated with
 *   the `@formValue()` decorator. This value field can have any name, but the
 *   type must be assignable to `string | File | FormData | null`.
 * - Form state: The state of the element is stored in the field decorated with
 *   the `@formState()` decorator. This state field can have any name, but the
 *   type must be assignable to `string | File | FormData | null`. The state
 *   field should be private, as it is only intended to be set by the
 *   FormAssociated mixin. The state field should usually be a getter/setter
 *   pair so that the form value can be derived from the state during form state
 *   restoration.
 * - Form reset: When the form is reset, the value field is set to its initial
 *   value, and the state field is set to its initial state. This means that the
 *   initial value and state will be stored for the lifetime of the element.
 * - Form state restoration: When the form is restored, the mode can be either
 *   'restore' or 'autocomplete'. In 'restore' mode, the state field is set to
 *   the state setter, if present, is set to the state that was previously
 *   passed to `internals.setFormValue()`. It's the state setter's
 *   responsibility to update the value setter. If there is no state setter, the
 *   value setter is updated directly. In 'autocomplete' mode, the value setter
 *   is updated directly.
 * - Form disabled: When the element is disabled, the `ariaDisabled` property of
 *   the ElementInternals is set to "true". The element's disable state can be
 *   checked with the `isDisabled()` function (an alias for
 *   `element.matches(':disabled')`).
 * - Validation: An element can implement the  `_getValidity()` method to
 *   validate its state. This method is called automatically when the form value
 *   changes, and can be called manually by the element.
 *
 * Implement a `_getValidity()` method that returns a `ValidityResult` to
 * validate the element.
 *
 * Implement a `_validate(): boolean` method to validate the element. This
 * method should be called by the element when its state might have changed in a
 * way that would affect its validity.
 *
 * Calls `_getValidity()` and sets the validity flags on the element's
 * internals, then returns the result of `internals.checkValidity()`.
 *
 * It's often a good idea to call this method in the constructor to set the
 * initial validity state.
 */
export const FormAssociated = <T extends Constructor<ReactiveElement>>(
  base: T
) => {
  class C extends base implements FormAssociated {
    static formAssociated = true;

    // This must be a `super` call, not a `this` call!
    #internals = super.attachInternals();
    #attachInternalsCalled = false;

    _getValidity?(): ValidityResult;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    constructor(...args: any[]) {
      super(...args);
      internalsCache.set(this, this.#internals);
      this.#internals.role =
        (this.constructor as FormAssociatedConstructor).role ?? null;
    }

    override attachInternals(): ElementInternals {
      if (this.#attachInternalsCalled) {
        // Call super.attachInternals() if attachInternals has already been
        // called to provoke the native error.
        super.attachInternals();
      }
      this.#attachInternalsCalled = true;
      return this.#internals;
    }

    _validate() {
      if (this._getValidity !== undefined) {
        const {flags, message, anchor} = this._getValidity();
        this.#internals.setValidity(flags, message, anchor);
      }
      return this.#internals.checkValidity();
    }

    formDisabledCallback(disabled: boolean) {
      this.#internals.ariaDisabled = String(disabled);
      this.requestUpdate();
    }

    formResetCallback() {
      const classKey = getClassKey(this.constructor);

      // Restore the initial value
      const valueAccess = valueAccessors.get(classKey);
      const defaultValueAccess = defaultValueAccessors.get(classKey);

      let defaultValue: unknown;

      if (defaultValueAccess !== undefined) {
        defaultValue = defaultValueAccess.get(this);
      } else {
        defaultValue = initialValues.get(this);
      }
      valueAccess?.set(this, defaultValue);

      // Restore the initial state
      const stateAccess = stateAccessors.get(classKey);
      const defaultStateAccess = defaultStateAccessors.get(classKey);

      let defaultState: FormValue | undefined;

      if (defaultStateAccess !== undefined) {
        defaultState = defaultStateAccess.get(this);
      } else {
        defaultState = initialStates.get(this);
      }
      stateAccess?.set?.(this, defaultState ?? null);
    }

    formStateRestoreCallback(
      state: string | File | FormData | null,
      mode: 'restore' | 'autocomplete'
    ) {
      const metadata = getClassKey(this.constructor);
      const stateAccess = stateAccessors.get(metadata);
      if (mode === 'restore' && stateAccess?.set !== undefined) {
        // When restoring a value we should get the state previously passed to
        // internals.setFormValue(). We can pass that to the state setter, which
        // should be implemented to update the value. If there is no state
        // accessor, we will update the value accessor in the next branch.
        stateAccess.set(this, state);
      } else {
        // In 'autocomple' mode a value, we don't get a previous state object,
        // so we should update the value accessor directly. In 'restore' mode
        // without a state setter, we will also update the value accessor here.
        const valueAccess = valueAccessors.get(metadata);
        const valueOptions = formValueOptions.get(metadata);
        const value =
          valueOptions?.converter !== undefined
            ? valueOptions.converter.fromFormValue(state)
            : state;
        valueAccess?.set(this, value);
      }
    }
  }
  return C as Constructor<FormAssociated> & T & FormAssociatedConstructor;
};

// #endregion

// #region Decorators

/*
 * Sets the ElementInternals form value and state and triggers validation.
 */
const setFormValue = (el: FormAssociated, value: unknown) => {
  const classKey = getClassKey(el.constructor);
  const options = formValueOptions.get(classKey);
  const internals = internalsCache.get(el);
  if (internals === undefined) {
    throw new Error('ElementInternals not found');
  }
  const state = stateAccessors.get(classKey)?.get?.(el);
  internals.setFormValue(
    options?.converter === undefined
      ? (value as FormValue)
      : options.converter.toFormValue(value),
    state
  );
  el._validate();
};

/**
 * A class accessor decorator that marks a field as the form value for the
 * FormAssociated mixin.
 */
type FormValueDecorator<T> = {
  // accessor decorator signature
  <C extends FormAssociated, V extends T>(
    target: ClassAccessorDecoratorTarget<C, V>,
    context: ClassAccessorDecoratorContext<C, V>
  ): ClassAccessorDecoratorResult<C, V>;

  // legacy decorator signature
  (
    proto: Object,
    name: PropertyKey,
    descriptor?: PropertyDescriptor
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ): void | any;
};

/**
 * A class accessor decorator that marks a field as the form value for the
 * FormAssociated mixin.
 */
export const formValue = <T = FormValue>(
  options?: FormValueOptions<T>
): FormValueDecorator<T> =>
  ((
    target: ClassAccessorDecoratorTarget<FormAssociated, T> | Object,
    context: ClassAccessorDecoratorContext<FormAssociated, T> | PropertyKey,
    descriptor?: PropertyDescriptor
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ): any => {
    if (typeof context === 'object') {
      // Standard decorator
      const {access, metadata} = context;
      // Store the value accessor and options for later use
      valueAccessors.set(metadata, access);
      if (options !== undefined) {
        formValueOptions.set(metadata, options);
      }

      return {
        get: (target as ClassAccessorDecoratorTarget<FormAssociated, T>).get,
        set(value: T) {
          (target as ClassAccessorDecoratorTarget<FormAssociated, T>).set.call(
            this,
            value
          );
          setFormValue(this, value);
        },
        init(value: T) {
          initialValues.set(this, value);
          return value;
        },
      };
    } else {
      // Legacy decorator

      if (descriptor === undefined) {
        // We don't support non-accessor fields in experimental decorators
        throw new Error('@formValue must be used on an accessor');
      }

      const proto = target as Object;
      const name = context;
      const ctor = proto.constructor;
      const classKey = getClassKey(ctor);

      if (options !== undefined) {
        formValueOptions.set(classKey, options);
      }

      valueAccessors.set(classKey, {
        get(obj: FormAssociated) {
          return obj[name as keyof typeof obj];
        },
        set(obj: FormAssociated, v: T) {
          // @ts-expect-error We know we're writing to a valid property
          obj[name as keyof typeof obj] = v;
        },
      });

      const originalSet = descriptor.set;
      if (originalSet) {
        descriptor.set = function (this: FormAssociated, value: T) {
          initializeValue(initialValues, this, descriptor, value);
          originalSet.call(this, value);
          setFormValue(this, value);
        };
      }
      return descriptor;
    }
  }) as FormValueDecorator<T>;

/**
 * A class accessor decorator that marks a field as the default value for the
 * FormAssociated mixin. This value is used when resetting the form.
 */
export const formDefaultValue =
  () =>
  <C extends FormAssociated, V>(
    _target: ClassAccessorDecoratorTarget<C, V>,
    context: ClassAccessorDecoratorContext<C, V>
  ) => {
    defaultValueAccessors.set(context.metadata, context.access);
  };

/**
 * A class accessor decorator that marks a field as the default state for the
 * FormAssociated mixin. This value is used when resetting the form.
 */
export const formDefaultState =
  () =>
  <C extends FormAssociated, V extends FormValue>(
    _target: ClassAccessorDecoratorTarget<C, V>,
    context: ClassAccessorDecoratorContext<C, V>
  ) => {
    defaultStateAccessors.set(context.metadata, context.access);
  };

type FormStateDecorator = {
  // Accessor decorator signature
  <C extends FormAssociated, V>(
    target: ClassAccessorDecoratorTarget<C, V>,
    context: ClassAccessorDecoratorContext<C, V>
  ): ClassAccessorDecoratorResult<C, V>;

  // Setter decorator signature
  <C extends FormAssociated, V>(
    target: (this: C, v: V) => void,
    context: ClassSetterDecoratorContext<C, V>
  ): (this: C, v: V) => void;

  // Legacy decorator signature
  (
    proto: Object,
    name: PropertyKey,
    descriptor?: PropertyDescriptor
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ): void | any;
};

/**
 * A class accessor or setter decorator that marks a field as being part of the
 * form state for the FormAssociated mixin. When this value is set, the form
 * value is updated with the new state.
 */
export const formState = (): FormStateDecorator =>
  (<C extends FormAssociated, V>(
    target:
      | ClassAccessorDecoratorTarget<C, V>
      | ((this: C, v: V) => void)
      | Object,
    context:
      | ClassAccessorDecoratorContext<C, V>
      | ClassSetterDecoratorContext<C, V>
      | PropertyKey,
    descriptor?: PropertyDescriptor
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ): ClassAccessorDecoratorResult<C, V> | ((this: C, v: V) => void) | any => {
    if (typeof context === 'object') {
      // Standard decorator
      const metadata = (context as ClassAccessorDecoratorContext<C, V>)
        .metadata;
      if (context.kind === 'accessor') {
        // Accessor
        return {
          get: (target as ClassAccessorDecoratorTarget<C, V>).get,
          set(value: V) {
            (target as ClassAccessorDecoratorTarget<C, V>).set.call(
              this,
              value
            );
            const valueAccess = valueAccessors.get(metadata);
            if (valueAccess !== undefined) {
              setFormValue(this, valueAccess.get(this));
            }
          },
          init(value: V) {
            initialStates.set(this, value as FormValue);
            return value;
          },
        };
      } else {
        // Setter
        return function (this: C, value: V) {
          (target as (this: C, v: V) => void).call(this, value);
          const valueAccess = valueAccessors.get(metadata);
          if (valueAccess !== undefined) {
            setFormValue(this, valueAccess.get(this));
          }
        };
      }
    } else {
      // Legacy decorator
      const proto = target as Object;
      const ctor = proto.constructor;
      const classKey = getClassKey(ctor);

      if (descriptor) {
        // Accessor or method
        const originalSet = descriptor.set;
        if (originalSet) {
          descriptor.set = function (this: C, value: V) {
            initializeValue(initialStates, this, descriptor, value);
            originalSet.call(this, value);
            const valueAccess = valueAccessors.get(classKey);
            if (valueAccess?.get) {
              setFormValue(this, valueAccess.get(this));
            }
          };
        }

        const access = stateAccessors.get(classKey) ?? {};
        if (descriptor.get) {
          access.get = (obj: FormAssociated) => {
            try {
              return descriptor.get!.call(obj);
            } catch (e) {
              // If the property is an accessor, it may not be initialized yet.
              return undefined as unknown as FormValue;
            }
          };
        }
        if (descriptor.set) {
          access.set = (obj: FormAssociated, v: FormValue) =>
            descriptor.set!.call(obj, v as V);
        }
        stateAccessors.set(classKey, access as Access<FormValue>);

        return descriptor;
      } else {
        // Field
        // We don't support non-accessor fields in experimental decorators
        // because we can't easily intercept the setter without defining a
        // property on the prototype, which is what we do for accessors.
        // To support fields we would need to use a different strategy, like
        // defining a getter/setter on the instance, which is more expensive.
        throw new Error(
          '@formState must be used on an accessor when using experimental decorators'
        );
      }
    }
  }) as FormStateDecorator;

type FormStateGetterDecorator = {
  <C extends FormAssociated, V extends FormValue>(
    target: (this: C) => V,
    context: ClassMethodDecoratorContext<C, (this: C) => V>
  ): void;

  (
    proto: Object,
    name: PropertyKey,
    descriptor: PropertyDescriptor
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ): void | any;
};

/**
 * A class method decorator that marks a method as the form state getter for the
 * FormAssociated mixin.
 *
 * This method should usually be private. The method should only be called by
 * the FormAssociated mixin, not by the element itself.
 */
export const formStateGetter = (): FormStateGetterDecorator =>
  (<C extends FormAssociated, V extends FormValue>(
    target: ((this: C) => V) | Object,
    context: ClassMethodDecoratorContext<C, (this: C) => V> | PropertyKey,
    descriptor?: PropertyDescriptor
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ): void | any => {
    if (typeof context === 'object') {
      // Standard decorator
      const metadata = (
        context as ClassMethodDecoratorContext<C, (this: C) => V>
      ).metadata;
      const access = stateAccessors.get(metadata) ?? {};
      const methodAccess = (
        context as ClassMethodDecoratorContext<C, (this: C) => V>
      ).access;
      access.get = (obj: FormAssociated) =>
        methodAccess.get(obj as C).call(obj as C);
      stateAccessors.set(metadata, access as Access<FormValue>);
    } else {
      // Legacy decorator
      const proto = target as Object;
      const name = context as PropertyKey;
      const ctor = proto.constructor;
      const classKey = getClassKey(ctor);
      const access = stateAccessors.get(classKey) ?? {};
      access.get = (obj: FormAssociated) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return (obj as any)[name].call(obj);
      };
      stateAccessors.set(classKey, access as Access<FormValue>);
      return descriptor;
    }
  }) as FormStateGetterDecorator;

type FormStateSetterDecorator = {
  <C extends FormAssociated, V extends FormValue>(
    target: (this: C, v: V) => void,
    context: ClassMethodDecoratorContext<C, (this: C, v: V) => void>
  ): void;

  (
    proto: Object,
    name: PropertyKey,
    descriptor: PropertyDescriptor
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ): void | any;
};

/**
 * A class method decorator that marks a method as the form state setter for the
 * FormAssociated mixin.
 *
 * This method should usually be private. The method should only be called by
 * the FormAssociated mixin, not by the element itself.
 */
export const formStateSetter = (): FormStateSetterDecorator =>
  (<C extends FormAssociated, V extends FormValue>(
    target: ((this: C, v: V) => void) | Object,
    context:
      | ClassMethodDecoratorContext<C, (this: C, v: V) => void>
      | PropertyKey,
    descriptor?: PropertyDescriptor
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ): void | any => {
    if (typeof context === 'object') {
      // Standard decorator
      const metadata = (
        context as ClassMethodDecoratorContext<C, (this: C, v: V) => void>
      ).metadata;
      const access = stateAccessors.get(metadata) ?? {};
      const methodAccess = (
        context as ClassMethodDecoratorContext<C, (this: C, v: V) => void>
      ).access;
      access.set = (obj: FormAssociated, v: V) =>
        methodAccess.get(obj as C).call(obj as C, v);
      stateAccessors.set(metadata, access as Access<FormValue>);
    } else {
      // Legacy decorator
      const proto = target as Object;
      const name = context as PropertyKey;
      const ctor = proto.constructor;
      const classKey = getClassKey(ctor);
      const access = stateAccessors.get(classKey) ?? {};
      access.set = (obj: FormAssociated, v: V) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (obj as any)[name].call(obj, v);
      };
      stateAccessors.set(classKey, access as Access<FormValue>);
      return descriptor;
    }
  }) as FormStateSetterDecorator;

// #endregion
