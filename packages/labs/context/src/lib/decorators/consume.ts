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
  context: context,
  subscribe,
}: {
  context: Context<unknown, ValueType>;
  subscribe?: boolean;
}): <K extends PropertyKey>(
  // Partial<> allows for providing the value to an optional field
  protoOrDescriptor: ReactiveElement & Partial<Record<K, ValueType>>,
  name?: K
  // Note TypeScript requires the return type to be `void|any`
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
) => void | any {
  return decorateProperty({
    finisher: (ctor: typeof ReactiveElement, name: PropertyKey) => {
      ctor.addInitializer((element: ReactiveElement): void => {
        new ContextConsumer(
          element,
          context,
          (value: ValueType) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any -- have to force the property on the type
            (element as any)[name] = value;
          },
          subscribe
        );
      });
    },
  });
}
