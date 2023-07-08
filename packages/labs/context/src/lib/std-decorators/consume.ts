/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {ReactiveElement} from '@lit/reactive-element';
import {ContextConsumer} from '../controllers/context-consumer.js';
import {Context} from '../create-context.js';

/**
 * A property decorator that adds a ContextConsumer controller to the component
 * which will try and retrieve a value for the property via the Context API.
 *
 * @param context A Context identifier value created via `createContext`
 * @param subscribe An optional boolean which when true allows the value to be
 *   updated multiple times.
 *
 * @example
 *
 * ```ts
 * import {consume} from '@lit-labs/context/std-decorators/consume.js';
 * import {loggerContext, Logger} from 'community-protocols/logger';
 *
 * class MyElement {
 *   @consume({context: loggerContext})
 *   logger?: Logger;
 *
 *   doThing() {
 *     this.logger?.log('thing was done');
 *   }
 * }
 * ```
 * @category Decorator
 */
export function consume<Provided>({
  context,
  subscribe,
}: {
  context: Context<unknown, Provided>;
  subscribe?: boolean;
}) {
  return <This extends ReactiveElement, Consuming>(
    _target: unknown,
    decoratorContext:
      | ClassFieldDecoratorContext<This, Consuming>
      | ClassAccessorDecoratorContext<This, Consuming>
  ): EnforceTypesMatch<Provided, Consuming, void> => {
    decoratorContext.addInitializer(function (this: This) {
      new ContextConsumer(this, {
        context,
        callback: (value: Provided) => {
          decoratorContext.access.set(this, value as unknown as Consuming);
        },
        subscribe,
      });
    });
    return undefined as unknown as EnforceTypesMatch<Provided, Consuming, void>;
  };
}

type EnforceTypesMatch<Provided, Consuming, Ok> = [Provided] extends [Consuming]
  ? Ok
  : {
      message: "the provided type isn't assignable to the consuming field";
      provided: Provided;
      consuming: Consuming;
    };
