/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

/**
 * When `condition` is true, returns the result of calling `trueCase()`, else
 * returns the result of calling `falseCase()` if `falseCase` is defined.
 *
 * This is a convenience wrapper around a ternary expression that makes it a
 * little nicer to write an inline conditional without an else.
 *
 * @example
 *
 * ```ts
 * render() {
 *   return html`
 *     ${when(this.user, () => html`User: ${this.user.username}, () => html`Sign In...`)}
 *   `;
 * }
 * ```
 */
export function when<T, F>(
  condition: true,
  trueCase: () => T,
  falseCase?: () => F
): T;
export function when<T, F = undefined>(
  condition: false,
  trueCase: () => T,
  falseCase?: () => F
): F;
export function when<T, F = undefined>(
  condition: boolean,
  trueCase: () => T,
  falseCase?: () => F
): T | F | undefined;
export function when(
  condition: boolean,
  trueCase: () => unknown,
  falseCase?: () => unknown
): unknown {
  return condition ? trueCase() : falseCase?.();
}

/**
 * Returns an iterable containing the result of calling `f(value)` on each
 * value in `items`.
 *
 * @example
 *
 * ```ts
 * render() {
 *   return html`
 *     <ul>
 *       ${map(items, (i) => html`<li>${i}</li>`)}
 *     </ul>
 *   `;
 * }
 * ```
 */
export function* map<T>(
  items: Iterable<T> | undefined,
  f: (value: T, index: number) => unknown
) {
  if (items !== undefined) {
    let i = 0;
    for (const value of items) {
      yield f(value, i++);
    }
  }
}

/**
 * Returns an iterable containing the values in `items` interleaved with the
 * `joiner` value.
 *
 * @example
 *
 * ```ts
 * render() {
 *   return html`
 *     ${join(items, html`<span class="separator">|</span>`)}
 *   `;
 * }
 */
export function join<I, J>(
  items: Iterable<I> | undefined,
  joiner: (index: number) => J
): Iterable<I | J>;
export function join<I, J>(
  items: Iterable<I> | undefined,
  joiner: J
): Iterable<I | J>;
export function* join<I, J>(items: Iterable<I> | undefined, joiner: J) {
  const isFunction = typeof joiner === 'function';
  if (items !== undefined) {
    let i = -1;
    for (const value of items) {
      if (i > -1) {
        yield isFunction ? joiner(i) : joiner;
      }
      i++;
      yield value;
    }
  }
}

/**
 * Returns an iterable of integers from `start` to `end` (exclusive)
 * incrementing by `step`.
 *
 * If `start` is omitted, the range starts at `0`. `step` defaults to `1`.
 *
 * @example
 *
 * ```ts
 * render() {
 *   return html`
 *     ${map(range(8), () => html`<div class="cell"></div>`)}
 *   `;
 * }
 * ```
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
  for (let i = start; step > 0 ? i < end : end < i; i += step) {
    yield i;
  }
}
