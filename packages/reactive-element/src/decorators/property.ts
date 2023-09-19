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

import {
  type PropertyDeclaration,
  type ReactiveElement,
  defaultConverter,
  notEqual,
} from '../reactive-element.js';
import type {Interface} from './base.js';

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
  <C extends Interface<ReactiveElement>, V>(
    target: ClassAccessorDecoratorTarget<C, V>,
    context: ClassAccessorDecoratorContext<C, V>
  ): ClassAccessorDecoratorResult<C, V>;

  // setter decorator signature
  <C extends Interface<ReactiveElement>, V>(
    target: (value: V) => void,
    context: ClassSetterDecoratorContext<C, V>
  ): (this: C, value: V) => void;

  // legacy decorator signature
  (
    protoOrDescriptor: Object,
    name: PropertyKey,
    descriptor?: PropertyDescriptor
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ): any;
};

const legacyProperty = (
  options: PropertyDeclaration | undefined,
  proto: Object,
  name: PropertyKey
) => {
  const hasOwnProperty = proto.hasOwnProperty(name);
  (proto.constructor as typeof ReactiveElement).createProperty(
    name,
    hasOwnProperty ? {...options, wrapped: true} : options
  );
  // For accessors (which have a descriptor on the prototype) we need to
  // return a descriptor, otherwise TypeScript overwrites the descriptor we
  // define in createProperty() with the original descriptor. We don't do this
  // for fields, which don't have a descriptor, because this could overwrite
  // descriptor defined by other decorators.
  return hasOwnProperty
    ? Object.getOwnPropertyDescriptor(proto, name)
    : undefined;
};

// This is duplicated from a similar variable in reactive-element.ts, but
// actually makes sense to have this default defined with the decorator, so
// that different decorators could have different defaults.
const defaultPropertyDeclaration: PropertyDeclaration = {
  attribute: true,
  type: String,
  converter: defaultConverter,
  reflect: false,
  hasChanged: notEqual,
};

// Temporary type, until google3 is on TypeScript 5.2
type StandardPropertyContext<C, V> = (
  | ClassAccessorDecoratorContext<C, V>
  | ClassSetterDecoratorContext<C, V>
) & {metadata: object};

/**
 * Wraps a class accessor or setter so that `requestUpdate()` is called with the
 * property name and old value when the accessor is set.
 */
export const standardProperty = <C extends Interface<ReactiveElement>, V>(
  options: PropertyDeclaration = defaultPropertyDeclaration,
  target: ClassAccessorDecoratorTarget<C, V> | ((value: V) => void),
  context: StandardPropertyContext<C, V>
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
      set(this: ReactiveElement, v: V) {
        const oldValue = (
          target as ClassAccessorDecoratorTarget<C, V>
        ).get.call(this as unknown as C);
        (target as ClassAccessorDecoratorTarget<C, V>).set.call(
          this as unknown as C,
          v
        );
        this.requestUpdate(name, oldValue, options);
      },
      init(this: ReactiveElement, v: V): V {
        if (v !== undefined) {
          this._$changeProperty(name, undefined, options);
        }
        return v;
      },
    } as unknown as ClassAccessorDecoratorResult<C, V>;
  } else if (kind === 'setter') {
    const {name} = context;
    return function (this: ReactiveElement, value: V) {
      const oldValue = this[name as keyof ReactiveElement];
      (target as (value: V) => void).call(this, value);
      this.requestUpdate(name, oldValue, options);
    } as unknown as (this: C, value: V) => void;
  }
  throw new Error(`Unsupported decorator location: ${kind}`);
};

/**
 * A class field or accessor decorator which creates a reactive property that
 * reflects a corresponding attribute value. When a decorated property is set
 * the element will update and render. A {@linkcode PropertyDeclaration} may
 * optionally be supplied to configure property features.
 *
 * This decorator should only be used for public fields. As public fields,
 * properties should be considered as primarily settable by element users,
 * either via attribute or the property itself.
 *
 * Generally, properties that are changed by the element should be private or
 * protected fields and should use the {@linkcode state} decorator.
 *
 * However, sometimes element code does need to set a public property. This
 * should typically only be done in response to user interaction, and an event
 * should be fired informing the user; for example, a checkbox sets its
 * `checked` property when clicked and fires a `changed` event. Mutating public
 * properties should typically not be done for non-primitive (object or array)
 * properties. In other cases when an element needs to manage state, a private
 * property decorated via the {@linkcode state} decorator should be used. When
 * needed, state properties can be initialized via public properties to
 * facilitate complex interactions.
 *
 * ```ts
 * class MyElement {
 *   @property({ type: Boolean })
 *   clicked = false;
 * }
 * ```
 * @category Decorator
 * @ExportDecoratedItems
 */
export function property(options?: PropertyDeclaration): PropertyDecorator {
  return <C extends Interface<ReactiveElement>, V>(
    protoOrTarget:
      | object
      | ClassAccessorDecoratorTarget<C, V>
      | ((value: V) => void),
    nameOrContext:
      | PropertyKey
      | ClassAccessorDecoratorContext<C, V>
      | ClassSetterDecoratorContext<C, V>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ): any => {
    return (
      typeof nameOrContext === 'object'
        ? standardProperty<C, V>(
            options,
            protoOrTarget as
              | ClassAccessorDecoratorTarget<C, V>
              | ((value: V) => void),
            nameOrContext as StandardPropertyContext<C, V>
          )
        : legacyProperty(
            options,
            protoOrTarget as Object,
            nameOrContext as PropertyKey
          )
    ) as PropertyDecorator;
  };
}
