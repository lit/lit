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
import {property as standardProperty} from '../std-decorators/property.js';

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

  // legacy experimental decorator signature
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (protoOrDescriptor: Object, name: PropertyKey): any;

  // union
  <C extends ReactiveElement, V>(
    protoOrTarget:
      | object
      | ClassAccessorDecoratorTarget<C, V>
      | ((value: V) => void),
    nameOrContext:
      | PropertyKey
      | ClassAccessorDecoratorContext
      | ClassSetterDecoratorContext
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ): any;
};

const legacyProperty = (
  options: PropertyDeclaration | undefined,
  proto: Object,
  name: PropertyKey
) => {
  (proto.constructor as typeof ReactiveElement).createProperty(name, options);
  // We need to return a descriptor here otherwise TypeScript overwrites
  // the decorator we define in createProperty().
  return Object.getOwnPropertyDescriptor(proto, name);
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
  return <C extends ReactiveElement, V>(
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
        ? standardProperty(options)<C, V>(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            protoOrTarget as any /*ClassAccessorDecoratorTarget<C, V> | ((value: V) => void)*/,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            nameOrContext as any /*ClassAccessorDecoratorContext<C, V> | ClassSetterDecoratorContext<C, V>*/
          )
        : legacyProperty(
            options,
            protoOrTarget as Object,
            nameOrContext as PropertyKey
          )
    ) as PropertyDecorator;
  };
}
