/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {ReactiveElement} from '@lit/reactive-element';
import {decorateProperty} from '@lit/reactive-element/decorators/base.js';
import {ContextConsumer} from '../controllers/context-consumer.js';
import {Context} from '../create-context.js';

/*
 * IMPORTANT: For compatibility with tsickle and the Closure JS compiler, all
 * property decorators (but not class decorators) in this file that have
 * an @ExportDecoratedItems annotation must be defined as a regular function,
 * not an arrow function.
 */

/**
 * A property decorator that adds a ContextConsumer controller to the component
 * which will try and retrieve a value for the property via the Context API.
 *
 * @param context A Context identifier value created via `createContext`
 * @param subscribe An optional boolean which when true allows the value to be updated
 *   multiple times.
 *
 * @example
 *
 * ```ts
 * import {consume} from '@lit-labs/context';
 * import {loggerContext, Logger} from 'community-protocols/logger';
 *
 * class MyElement {
 *   @consume({context: loggerContext})
 *   logger?: Logger;
 *
 *   doThing() {
 *     this.logger!.log('thing was done');
 *   }
 * }
 * ```
 * @category Decorator
 */
export function consume<ValueType>({
  context,
  subscribe,
}: {
  context: Context<unknown, ValueType>;
  subscribe?: boolean;
}): ConsumerDecorator<ValueType> {
  return decorateProperty({
    finisher: (ctor: typeof ReactiveElement, name: PropertyKey) => {
      ctor.addInitializer((element: ReactiveElement): void => {
        new ContextConsumer(element, {
          context,
          callback: (value: ValueType) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any -- have to force the property on the type
            (element as any)[name] = value;
          },
          subscribe,
        });
      });
    },
  });
}

type ConsumerDecorator<ValueType> = {
  <K extends PropertyKey, Proto extends ReactiveElement>(
    protoOrDescriptor: Proto,
    name?: K
  ): FieldMustMatchProvidedType<Proto, K, ValueType>;
};

// Note TypeScript requires the return type of a decorator to be `void | any`
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DecoratorReturn = void | any;

type FieldMustMatchProvidedType<Obj, Key extends PropertyKey, ProvidedType> =
  // First we check whether the object has the property as a required field
  Obj extends Record<Key, infer ConsumingType>
    ? // Ok, it does, just check whether it's ok to assign the
      // provided type to the consuming field
      [ProvidedType] extends [ConsumingType]
      ? DecoratorReturn
      : {
          message: 'provided type not assignable to consuming field';
          provided: ProvidedType;
          consuming: ConsumingType;
        }
    : // Next we check whether the object has the property as an optional field
    Obj extends Partial<Record<Key, infer ConsumingType>>
    ? // Check assignability again. Note that we have to include undefined
      // here on the consuming type because it's optional.
      [ProvidedType] extends [ConsumingType | undefined]
      ? DecoratorReturn
      : {
          message: 'provided type not assignable to consuming field';
          provided: ProvidedType;
          consuming: ConsumingType | undefined;
        }
    : // Ok, the field isn't present, so either someone's using consume
      // manually, i.e. not as a decorator (maybe don't do that! but if you do,
      // you're on your own for your type checking, sorry), or the field is
      // private, in which case we can't check it.
      DecoratorReturn;
