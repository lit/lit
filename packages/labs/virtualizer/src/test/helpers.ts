/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

/**
 * To aid in Mocha's reporting from within any helper method that
 * throws an error, this function returns the line of a stack trace
 * which indicates the caller of the caller of this function.
 */
export function getCallerFromStack() {
  try {
    throw new Error();
  } catch (e: unknown) {
    return (e as Error).stack?.split(/\n/)[3]?.replace(/^ {2}/, '');
  }
}

/**
 * Use this to await a condition (given as an anonymous function that returns
 * a boolean value) to be met.  We will stop waiting after the timeout is
 * exceeded, after which time we will reject the promise.
 */
export async function until(cond: () => Boolean, timeout = 1000) {
  const start = new Date().getTime();
  const caller = getCallerFromStack();
  return new Promise((resolve, reject) => {
    check();
    function check() {
      if (cond()) {
        return resolve(true);
      }
      const now = new Date().getTime();
      if (now - start > timeout) {
        return reject(
          new Error(
            `Condition not met within ${timeout}ms: "${cond.toString()}"\n${caller}`
          )
        );
      }
      setTimeout(check, 0);
    }
  });
}

/**
 * This solution was inspired to address the issue described in the following links:
 * https://stackoverflow.com/questions/49384120/resizeobserver-loop-limit-exceeded
 * https://stackoverflow.com/questions/9025095/how-can-i-test-uncaught-errors-in-mocha
 *
 * Before/After parameters are given to the function to ensure there are no user-error
 * cases where teardown is forgotten/skipped.
 */
export function ignoreBenignErrors(
  before: Mocha.HookFunction,
  after: Mocha.HookFunction
) {
  ignoreWindowErrors(
    before,
    after,
    /ResizeObserver loop limit exceeded|ResizeObserver loop completed with undelivered notifications/
  );
}
/**
 * Sets up the window.onerror handler to ignore uncaught exceptions which match the regexp.
 */
export function ignoreWindowErrors(
  before: Mocha.HookFunction,
  after: Mocha.HookFunction,
  regexp: RegExp
) {
  let onerrorOriginal: OnErrorEventHandler;
  let onerrorNew: OnErrorEventHandler;

  before(() => {
    onerrorOriginal = window.onerror;
    onerrorNew = (err, ...restArgs) => {
      if (regexp.test(`${err}`)) {
        console.warn(`Ignored Error: ${err}`);
        return false;
      }
      if (onerrorOriginal) {
        return onerrorOriginal.apply(window, [
          err,
          ...restArgs,
        ] as unknown as Parameters<typeof onerrorOriginal>);
      }
    };
    window.onerror = onerrorNew;
  });
  after(() => {
    if (onerrorNew !== window.onerror) {
      throw new Error(
        'Unexpected window.onerror handler due to out-of-sequence teardown.'
      );
    }
    window.onerror = onerrorOriginal;
  });
}
