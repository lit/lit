/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

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
