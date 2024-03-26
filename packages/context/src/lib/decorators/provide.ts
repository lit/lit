/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {ReactiveElement} from '@lit/reactive-element';
import {Context} from '../create-context.js';
import {ContextProvider} from '../controllers/context-provider.js';

/*
 * IMPORTANT: For compatibility with tsickle and the Closure JS compiler, all
 * property decorators (but not class decorators) in this file that have
 * an @ExportDecoratedItems annotation must be defined as a regular function,
 * not an arrow function.
 */

/**
 * A property decorator that adds a ContextProvider controller to the component
 * making it respond to any `context-request` events from its children consumer.
 *
 * @param context A Context identifier value created via `createContext`
 *
 * @example
 *
 * ```ts
 * import {provide} from '@lit/context';
 * import {Logger} from 'my-logging-library';
 * import {loggerContext} from './logger-context.js';
 *
 * class MyElement {
 *   @provide({context: loggerContext})
 *   logger = new Logger();
 * }
 * ```
 * @category Decorator
 */
export function provide<ValueType>({
  context: context,
}: {
  context: Context<unknown, ValueType>;
}): ProvideDecorator<ValueType> {
  return (<C extends ReactiveElement, V extends ValueType>(
    protoOrTarget: ClassAccessorDecoratorTarget<C, V>,
    nameOrContext: PropertyKey | ClassAccessorDecoratorContext<C, V>
  ) => {
    // Map of instances to controllers
    const controllerMap = new WeakMap<
      ReactiveElement,
      ContextProvider<Context<unknown, ValueType>>
    >();
    if (typeof nameOrContext === 'object') {
      // Standard decorators branch
      nameOrContext.addInitializer(function (this: ReactiveElement) {
        controllerMap.set(this, new ContextProvider(this, {context}));
      });
      return {
        get(this: ReactiveElement) {
          return protoOrTarget.get.call(this as unknown as C);
        },
        set(this: ReactiveElement, value: V) {
          controllerMap.get(this)?.setValue(value);
          return protoOrTarget.set.call(this as unknown as C, value);
        },
        init(this: ReactiveElement, value: V) {
          controllerMap.get(this)?.setValue(value);
          return value;
        },
      };
    } else {
      // Experimental decorators branch
      (protoOrTarget.constructor as typeof ReactiveElement).addInitializer(
        (element: ReactiveElement): void => {
          controllerMap.set(element, new ContextProvider(element, {context}));
        }
      );
      // proxy any existing setter for this property and use it to
      // notify the controller of an updated value
      const descriptor = Object.getOwnPropertyDescriptor(
        protoOrTarget,
        nameOrContext
      );
      let newDescriptor: PropertyDescriptor;
      if (descriptor === undefined) {
        const valueMap = new WeakMap<ReactiveElement, ValueType>();
        newDescriptor = {
          get: function (this: ReactiveElement) {
            return valueMap.get(this);
          },
          set: function (this: ReactiveElement, value: ValueType) {
            controllerMap.get(this)!.setValue(value);
            valueMap.set(this, value);
          },
          configurable: true,
          enumerable: true,
        };
      } else {
        const oldSetter = descriptor.set;
        newDescriptor = {
          ...descriptor,
          set: function (this: ReactiveElement, value: ValueType) {
            controllerMap.get(this)!.setValue(value);
            oldSetter?.call(this, value);
          },
        };
      }
      Object.defineProperty(protoOrTarget, nameOrContext, newDescriptor);
      return;
    }
  }) as ProvideDecorator<ValueType>;
}

/**
 * Generates a public interface type that removes private and protected fields.
 * This allows accepting otherwise compatible versions of the type (e.g. from
 * multiple copies of the same package in `node_modules`).
 */
type Interface<T> = {
  [K in keyof T]: T[K];
};

type ProvideDecorator<ContextType> = {
  // legacy
  <
    K extends PropertyKey,
    Proto extends Interface<Omit<ReactiveElement, 'renderRoot'>>
  >(
    protoOrDescriptor: Proto,
    name?: K
  ): FieldMustMatchContextType<Proto, K, ContextType>;

  // standard
  <
    C extends Interface<Omit<ReactiveElement, 'renderRoot'>>,
    V extends ContextType
  >(
    value: ClassAccessorDecoratorTarget<C, V>,
    context: ClassAccessorDecoratorContext<C, V>
  ): void;
};

// Note TypeScript requires the return type of a decorator to be `void | any`
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DecoratorReturn = void | any;

type FieldMustMatchContextType<Obj, Key extends PropertyKey, ContextType> =
  // First we check whether the object has the property as a required field
  Obj extends Record<Key, infer ProvidingType>
    ? // Ok, it does, just check whether it's ok to assign the
      // provided type to the consuming field
      [ProvidingType] extends [ContextType]
      ? DecoratorReturn
      : {
          message: 'providing field not assignable to context';
          context: ContextType;
          provided: ProvidingType;
        }
    : // Next we check whether the object has the property as an optional field
    Obj extends Partial<Record<Key, infer Providing>>
    ? // Check assignability again. Note that we have to include undefined
      // here on the providing type because it's optional.
      [Providing | undefined] extends [ContextType]
      ? DecoratorReturn
      : {
          message: 'providing field not assignable to context';
          context: ContextType;
          consuming: Providing | undefined;
        }
    : // Ok, the field isn't present, so either someone's using provide
      // manually, i.e. not as a decorator (maybe don't do that! but if you do,
      // you're on your own for your type checking, sorry), or the field is
      // private, in which case we can't check it.
      DecoratorReturn;
