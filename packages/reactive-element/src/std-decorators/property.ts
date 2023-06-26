/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

/*
 * IMPORTANT: For compatibility with tsickle and the Closure JS compiler, all
 * property decorators (but not class decorators) in this file that have
 * an @ExportDecoratedItems annotation must be defined as a regular function,
 * not an arrow function.
 */
import {PropertyDeclaration, ReactiveElement} from '../reactive-element.js';

// Overloads for property decorator so that TypeScript can infer the correct
// return type when a decorator is used as an accessor decorator or a setter
// decorator.
export type PropertyDecorator = {
  // accessor decorator signature
  <C extends ReactiveElement, V>(
    target: ClassAccessorDecoratorTarget<C, V>,
    context: ClassAccessorDecoratorContext<C, V>
  ): ClassAccessorDecoratorResult<C, V>;

  // setter decorator signature
  <C extends ReactiveElement, V>(
    target: (value: V) => void,
    context: ClassSetterDecoratorContext<C, V>
  ): (this: C, value: V) => void;
};

/**
 * Wraps a class accessor or setter so that `requestUpdate()` is called with the
 * property name and old value when the accessor is set.
 */
export const property = (options?: PropertyDeclaration): PropertyDecorator =>
  (<C extends ReactiveElement, V>(
    target: ClassAccessorDecoratorTarget<C, V> | ((value: V) => void),
    context:
      | ClassAccessorDecoratorContext<C, V>
      | ClassSetterDecoratorContext<C, V>
  ): ClassAccessorDecoratorResult<C, V> | ((this: C, value: V) => void) => {
    const {kind} = context;
    if (kind === 'accessor') {
      // Standard decorators cannot dynamically modify the class, so we can't
      // replace a field with accessors. The user must use the new `accessor`
      // keyword instead.
      const {name} = context;
      return {
        get(this: C) {
          // @ts-expect-error: argh
          return (target as ClassAccessorDecoratorTarget<C, V>).get();
        },
        set(this: C, v: V) {
          // @ts-expect-error: argh
          const oldValue = (target as ClassAccessorDecoratorTarget<C, V>).get();
          // @ts-expect-error: argh
          (target as ClassAccessorDecoratorTarget<C, V>).set(v);
          this.requestUpdate(name, oldValue, options);
        },
        init(this: C, v: V): V {
          // Save instance property through setter
          if (this.hasOwnProperty(name)) {
            // @ts-expect-error: argh
            delete this[name as keyof this];
            // @ts-expect-error: argh
            this[name as keyof this] = v;
          }
          return v;
        },
      };
    } else if (kind === 'setter') {
      // NOTE: Because we need to wrap the setter, and we can't modify the class
      // directly in a standard decorator, we can only decorate setters, not
      // getters. This is change from our legacy decorators.
      const {name} = context;
      return function (this: C, value: V) {
        const oldValue = this[name as keyof C];
        (target as (value: V) => void)(value);
        this.requestUpdate(name, oldValue, options);
      };
    }
    throw new Error();
  }) as PropertyDecorator;
