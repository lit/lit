/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

/**
 * The Context type defines a type brand to associate a key value with the context value type
 */
export type Context<KeyType, ValueType> = KeyType & {__context__: ValueType};

/**
 * @deprecated use Context instead
 */
export type ContextKey<KeyType, ValueType> = Context<KeyType, ValueType>;

/**
 * A helper type which can extract a Context value type from a Context type
 */
export type ContextType<Key extends Context<unknown, unknown>> =
  Key extends Context<unknown, infer ValueType> ? ValueType : never;

/**
 * Creates a typed Context.
 *
 * Contexts are compared with with strict equality.
 *
 * If you want two separate `createContext()` calls to referer to the same
 * context, then use a key that will by equal under strict equality like a
 * string for `Symbol.for()`:
 *
 * ```ts
 * // true
 * createContext('my-context') === createContext('my-context')
 * // true
 * createContext(Symbol.for('my-context')) === createContext(Symbol.for('my-context'))
 * ```
 *
 * If you want a context to be unique so that it's guaranteed to not collide
 * with other contexts, use a key that's unique under strict equality, like
 * a `Symbol()` or object.:
 *
 * ```
 * // false
 * createContext({}) === createContext({})
 * // false
 * createContext(Symbol('my-context')) === createContext(Symbol('my-context'))
 * ```
 *
 * @param key a context key value
 * @template ValueType the type of value that can be provided by this context.
 * @returns the context key value cast to `Context<K, ValueType>`
 */
export function createContext<ValueType, K = unknown>(key: K) {
  return key as Context<K, ValueType>;
}
