/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

/**
 * Shared constructor type utilities for Lit mixins.
 *
 * These types support the standard TypeScript mixin pattern, allowing mixins
 * to accept both concrete and abstract base classes.
 */

/**
 * A concrete constructor type. Instances of this type can be called with `new`.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Constructor<T = {}> = new (...args: any[]) => T;

/**
 * An abstract constructor type. Accepts both abstract and concrete classes.
 * Use this as the constraint in mixin functions to allow abstract base classes.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AbstractConstructor<T = {}> = abstract new (...args: any[]) => T;
