/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
export type AnyFunction = (...args: any[]) => any;
/* eslint-enable @typescript-eslint/no-explicit-any */

/**
 * An MethodInterceptor function is defined as accepting a function it is intercepting
 * or "wrapping" calls to.  It has the same signature as the original function, except
 * that it has an additional first argument that is the "original" or wrapped
 * function that may be called or not depending on the interceptor's logic.  The
 * approach is analagous to calling super() in a subclass's method.
 */
export type MethodInterceptor<T extends AnyFunction> = (
  originalFunction: T | undefined,
  ...args: Parameters<T>
) => ReturnType<T>;

/**
 * An InterceptorTeardown function reverses the effects of an interceptMethod().
 */
export type MethodInterceptorTeardown = () => void;

/**
 * Replaces the method on the object with a new method that calls the interceptor
 * function along with the original function so the interceptor can decided how to
 * handle the call.  Essentially enables wrapping an existing method with new logic
 * similarly to how a subclass can call super() to invoke the superclass's method.
 * @param object The method's host object
 * @param methodName The name of the method to intercept/wrap
 * @param interceptor The interceptor function that is called when the method is
 *   called.  It is passed the original method as the first argument, followed by
 *   the original method's arguments.
 * @returns a teardown function that can be called to restore the original method
 *   to the object.
 */
export function interceptMethod<
  T extends object,
  K extends keyof T,
  F extends AnyFunction,
>(
  target: T,
  methodName: K,
  interceptor: MethodInterceptor<F>
): MethodInterceptorTeardown {
  const originalMethod = target[methodName] as unknown as F | undefined;
  const newMethod: Function = (...args: unknown[]) =>
    interceptor.bind(target)(originalMethod, ...(args as Parameters<F>));
  Object.assign(target, {[<string>methodName]: newMethod});
  return () => {
    if ((target[methodName] as unknown as F | undefined) !== newMethod) {
      throw new Error(
        `Unexpected method "${
          methodName as string
        }" on ${target} likely due to out-of-sequence interceptor teardown.`
      );
    }
    Object.assign(target, {[<string>methodName]: originalMethod});
    return originalMethod as F;
  };
}
