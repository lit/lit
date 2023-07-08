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
 * A property decorator that adds a ContextConsumer controller to the component
 * which will try and retrieve a value for the property via the Context API.
 *
 * @param context A Context identifier value created via `createContext`
 * @param multiple An optional boolean which when true allows the value to be updated
 *   multiple times.
 *
 * See: https://developer.mozilla.org/en-US/docs/Web/API/Document/querySelector
 *
 * @example
 *
 * ```ts
 * import {consume} from '@lit-labs/context';
 * import {loggerContext} from 'community-protocols/logger';
 *
 * class MyElement {
 *   @provide({context: loggerContext})
 *   logger;
 *
 *   doThing() {
 *     this.logger.log('thing was done');
 *   }
 * }
 * ```
 * @category Decorator
 */
export function provide<Expected>({
  context: context,
}: {
  context: Context<unknown, Expected>;
}) {
  return <This extends ReactiveElement, Providing>(
    target: ClassAccessorDecoratorTarget<This, Providing>,
    decoratorContext: ClassAccessorDecoratorContext<This, Providing>
  ): EnforceTypesMatch<
    Expected,
    Providing,
    ClassAccessorDecoratorResult<This, Providing>
  > => {
    const controllerMap = new WeakMap<
      This,
      ContextProvider<Context<unknown, Providing>>
    >();
    decoratorContext.addInitializer(function (this: This) {
      controllerMap.set(
        this,
        new ContextProvider(
          this,
          // this cast is ok because we're already using the type system to
          // ensure that Providing is assignable to Expected
          {context: context as unknown as Context<unknown, Providing>}
        )
      );
    });
    return {
      get(this: This) {
        return target.get.call(this);
      },
      set(this: This, value: Providing) {
        controllerMap.get(this)?.setValue(value);
        return target.set.call(this, value);
      },
    } as unknown as EnforceTypesMatch<
      Expected,
      Providing,
      ClassAccessorDecoratorResult<This, Providing>
    >;
  };
}

type EnforceTypesMatch<Expected, Providing, Ok> = [Providing] extends [Expected]
  ? Ok
  : {
      message: "the providing field isn't assignable to this context";
      providing: Providing;
      context: Expected;
    };
