/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

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
 * A promise which will resolve to the first truthy result of condition
 * function or the last result of calling it within the given timeout.
 * The intended usage of this function in a test would look something
 * like:
 *
 *     const thing = await eventually(() => doc.query('thing'));
 *
 */
export async function eventually<T>(cond: () => T, timeout = 1000): Promise<T> {
  const start = new Date().getTime();
  return new Promise((resolve, _reject) => {
    check();
    function check() {
      const result = cond();
      if (result || new Date().getTime() - start > timeout) {
        return resolve(result);
      }
      setTimeout(check, 0);
    }
  });
}

/**
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
