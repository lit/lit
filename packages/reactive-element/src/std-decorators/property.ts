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
import {
  PropertyDeclaration,
  ReactiveElement,
  defaultConverter,
  notEqual,
  type PropertyValues,
} from '../reactive-element.js';

const DEV_MODE = true;

let issueWarning: (code: string, warning: string) => void;

if (DEV_MODE) {
  // Ensure warnings are issued only 1x, even if multiple versions of Lit
  // are loaded.
  const issuedWarnings: Set<string | undefined> =
    (globalThis.litIssuedWarnings ??= new Set());

  // Issue a warning, if we haven't already.
  issueWarning = (code: string, warning: string) => {
    warning += ` See https://lit.dev/msg/${code} for more information.`;
    if (!issuedWarnings.has(warning)) {
      console.warn(warning);
      issuedWarnings.add(warning);
    }
  };
}

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

// TODO (justinfagnani): export from ReactiveElement?
// It actually makes sense to have this default defined with the decorator, so
// that different decirators could have different defaults.
const defaultPropertyDeclaration: PropertyDeclaration = {
  attribute: true,
  type: String,
  converter: defaultConverter,
  reflect: false,
  hasChanged: notEqual,
};

/**
 * Wraps a class accessor or setter so that `requestUpdate()` is called with the
 * property name and old value when the accessor is set.
 */
export const property = (
  options: PropertyDeclaration = defaultPropertyDeclaration
): PropertyDecorator =>
  (<C extends ReactiveElement, V>(
    target: ClassAccessorDecoratorTarget<C, V> | ((value: V) => void),
    context:
      | ClassAccessorDecoratorContext<C, V>
      | ClassSetterDecoratorContext<C, V>
  ): ClassAccessorDecoratorResult<C, V> | ((this: C, value: V) => void) => {
    const {kind, metadata} = context;

    if (DEV_MODE && metadata == null) {
      issueWarning(
        'missing-class-metadata',
        `The class ${target} is missing decorator metadata. This ` +
          `could mean that you're using a compiler that supports decorators ` +
          `but doesn't support decorator metadata, such as TypeScript 5.1. ` +
          `Please update your compiler.`
      );
    }

    // Store the property options
    let properties = globalThis.litPropertyMetadata.get(metadata);
    if (properties === undefined) {
      globalThis.litPropertyMetadata.set(metadata, (properties = new Map()));
    }
    properties.set(context.name, options);

    if (kind === 'accessor') {
      // Standard decorators cannot dynamically modify the class, so we can't
      // replace a field with accessors. The user must use the new `accessor`
      // keyword instead.
      const {name} = context;
      return {
        set(this: C, v: V) {
          const oldValue = (
            target as ClassAccessorDecoratorTarget<C, V>
          ).get.call(this);
          (target as ClassAccessorDecoratorTarget<C, V>).set.call(this, v);
          this.requestUpdate(name, oldValue, options);
        },
        init(this: C, v: V): V {
          if (v !== undefined) {
            // We need this cast because these decorators are in a separate
            // compilation unit from ReactiveElement, so can't see the
            // @internal _$changedProperties field.
            (
              this as unknown as {_$changedProperties: PropertyValues}
            )._$changedProperties.set(name, undefined);
          }
          return v;
        },
      };
    } else if (kind === 'setter') {
      // TODO: legacy decorators do not automatically call requestUpdate() like
      // this, because it was difficult to wrap the user-written accessors.
      // NOTE: Because we need to wrap the setter, and we can't modify the class
      // directly in a standard decorator, we can only decorate setters, not
      // getters. This is change from our legacy decorators.
      // const {name} = context;
      // return function (this: C, value: V) {
      //   const oldValue = this[name as keyof C];
      //   (target as (value: V) => void).call(this, value);
      //   this.requestUpdate(name, oldValue, options);
      // };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return undefined as any;
    }
    throw new Error(`Unsupported decorator location: ${kind}`);
  }) as PropertyDecorator;
