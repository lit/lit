/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {
  ignoreWindowOnError,
  setupIgnoreWindowResizeObserverLoopErrors,
} from '../support/resize-observer-errors.js';

/**
 * Returns an array of 'n' items.  If no map function given, it
 * contains just numbers from 0 to length - 1.  Otherwise, the
 * map function is applied to each item in the array to produce
 * the output.
 */
export function array(n: number): number[] {
  return Array.from(Array(n).keys());
}

/**
 * Returns the first item in the array, for more readable tests.
 */
export function first<T>(items: T[]) {
  return items[0];
}

/**
 * Returns the last item in the array, for more readable tests.
 */
export function last<T>(items: T[]) {
  return items[items.length - 1];
}

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

function getParentElement(el: Element) {
  if (el.parentElement !== null) {
    return el.parentElement;
  }
  const parentNode = el.parentNode;
  if (parentNode && parentNode.nodeType === Node.DOCUMENT_FRAGMENT_NODE) {
    return (parentNode as ShadowRoot).host || null;
  }
  return null;
}

function getElementAncestors(el: Element, includeSelf = false) {
  const ancestors = [];
  let parent = includeSelf ? el : getParentElement(el);
  while (parent !== null) {
    ancestors.push(parent);
    parent = getParentElement(parent);
  }
  return ancestors;
}

function getClippingAncestors(el: Element, includeSelf = false) {
  return getElementAncestors(el, includeSelf).filter(
    (a) => getComputedStyle(a).overflow !== 'visible'
  );
}

/**
 * Given an element and an optional viewport element, returns true if the
 * element would be visible in the viewport.  If no viewport is provided,
 * the window/document.documentElement is used.
 */
export function isInViewport(element: Element, viewport?: Element) {
  const elementRect = element.getBoundingClientRect();

  let top = 0;
  let left = 0;
  let bottom = window.innerHeight;
  let right = window.innerWidth;

  if (viewport) {
    const clippingAncestors = getClippingAncestors(viewport, true);

    for (const ancestor of clippingAncestors) {
      const ancestorBounds = ancestor.getBoundingClientRect();
      top = Math.max(top, ancestorBounds.top);
      left = Math.max(left, ancestorBounds.left);
      bottom = Math.min(bottom, ancestorBounds.bottom);
      right = Math.min(right, ancestorBounds.right);
    }
  }

  return (
    elementRect.top < bottom &&
    elementRect.left < right &&
    elementRect.bottom > top &&
    elementRect.right > left
  );
}

/**
 * Not exporting this function because the name is too generic and
 * there are two more semantically meaningful use cases expressed by
 * its dependent functions `pass` and `until`.
 */
async function eventually<T>(cond: () => T, timeout = 1000): Promise<T> {
  const start = new Date().getTime();
  return new Promise((resolve, reject) => {
    check();
    function check() {
      const [result, err] = testCond();
      if (result) {
        return resolve(result);
      }
      if (new Date().getTime() - start > timeout) {
        if (err) {
          return reject(err);
        }
        return resolve(result!);
      }
      setTimeout(check, 0);
    }
    function testCond(): [T?, Error?] {
      try {
        return [cond(), undefined];
      } catch (e: unknown) {
        return [undefined, e as Error];
      }
    }
  });
}

/**
 * Returns a promise for the result of the code block given.  Errors are swallowed
 * by the function until the timeout is reached, after which the error will be
 * thrown.  This means you can use `pass` to wait for expectations like so:
 *
 *     await pass(() => expect(thing).to.be.true);
 *
 * @param block Callback function to be executed again and again until no errors
 * are thrown.  Pass will always immediately return any successful result of the
 * block, even if it is undefined or falsy.
 * @param timeout
 * @returns
 */
export async function pass<T>(block: () => T, timeout = 1000): Promise<T> {
  let result: T;
  await eventually(() => {
    result = block();
    return result || true;
  }, timeout);
  return result! as T;
}

/**
 * Returns a promise which will resolve to the first truthy result of condition
 * function.  The intended usage of this function in a test would look something
 * like:
 *
 *     const thing = await until(() => doc.query('thing'));
 *
 * Use this to await a condition (given as an anonymous function that returns
 * a boolean value) to be met.  We will stop waiting after the timeout is
 * exceeded, after which time we will reject the promise.
 */
export async function until<T>(cond: () => T, timeout = 1000): Promise<T> {
  const caller = getCallerFromStack();
  const result = await eventually(cond, timeout);
  if (result) {
    return result;
  } else {
    throw new Error(
      `Condition not met within ${timeout}ms: "${cond.toString()}"\n${caller}`
    );
  }
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
  return setupIgnoreWindowResizeObserverLoopErrors(before, after);
}

/**
 *
 * @param before
 * @param after
 * @param regexp
 */
export function ignoreWindowErrors(
  before: Mocha.HookFunction,
  after: Mocha.HookFunction,
  regexp: RegExp
) {
  let teardown: Function | undefined;
  before(
    () => (teardown = ignoreWindowOnError((message) => regexp.test(message)))
  );
  after(() => {
    teardown?.();
    teardown = undefined;
  });
}
