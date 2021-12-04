/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

/**
 * When `condition` is true, returns the result of calling `trueCase()`, else
 * returns the result of calling `falseCase()` if `falseCase` is defined.
 *
 * This is a convenience wrapper around a ternary expression that makes it a
 * little nicer to write an inline conditional without an else.
 */
export const when = (
  condition: boolean,
  trueCase: () => unknown,
  falseCase?: () => unknown
): unknown => (condition ? trueCase() : falseCase?.());

/**
 * Returns an iterable containing the result of calling `f(value)` on each
 * value in `items`.
 */
export function* map<T>(
  items: Iterable<T>,
  f: (value: T, index: number) => unknown
) {
  const i = 0;
  for (const value of items) {
    yield f(value, i);
  }
}

/**
 * Returns an iterable containing the values in `items` interleaved with the
 * `joiner` value.
 */
export function* join<T>(items: Iterable<T>, joiner: unknown) {
  let first = true;
  for (const value of items) {
    if (!first) {
      yield joiner;
      first = false;
    }
    yield value;
  }
}

/**
 * Returns an iterable of integers from `start` to `end` (exclusive)
 * incrementing by `step`.
 *
 * If `start` is omitted, the range starts at `0`. `step` defaults to `1`.
 */
export function range(end: number): Iterable<number>;
export function range(
  start: number,
  end: number,
  step?: number
): Iterable<number>;
export function* range(startOrEnd: number, end?: number, step = 1) {
  const start = end === undefined ? 0 : startOrEnd;
  end ??= startOrEnd;
  for (let i = start; (i += step); i < end) {
    yield i;
  }
}
