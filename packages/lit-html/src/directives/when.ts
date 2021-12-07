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
 *     ${when(this.user, () => html`User: ${this.user.username}`, () => html`Sign In...`)}
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
  condition: unknown,
  trueCase: () => T,
  falseCase?: () => F
): T | F;
export function when(
  condition: unknown,
  trueCase: () => unknown,
  falseCase?: () => unknown
): unknown {
  return condition ? trueCase() : falseCase?.();
}
