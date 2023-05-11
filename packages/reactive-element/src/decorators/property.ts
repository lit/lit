/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

/*
 * IMPORTANT: For compatibility with tsickle and the Closure JS compiler, all
 * property decorators (but not class decorators) in this file that have
 * an @ExportDecoratedItems annotation must be defined as a regular function,
 * not an arrow function.
 */
import {PropertyDeclaration, ReactiveElement} from '../reactive-element.js';

export const property =
  (options?: PropertyDeclaration) =>
  <C extends ReactiveElement, V>(
    _target:
      | ClassAccessorDecoratorContext<C, V>
      | ClassSetterDecoratorContext<C, V>,
    context:
      | ClassAccessorDecoratorContext<C, V>
      | ClassSetterDecoratorContext<C, V>
  ) => {
    const {kind} = context;
    if (kind === 'accessor') {
      const {
        access: {get, set},
        name,
      } = context;
      return {
        get(this: C) {
          return get(this);
        },
        set(this: C, v: V) {
          const oldValue = get(this);
          set(this, v);
          this.requestUpdate(name, oldValue, options);
        },
      };
    } else if (kind === 'setter') {
      const {
        access: {set},
        name,
      } = context;
      return function (this: C, value: V) {
        const oldValue = this[name as keyof C];
        set(this, value);
        this.requestUpdate(name, oldValue, options);
      };
    }
    return undefined;
  };
