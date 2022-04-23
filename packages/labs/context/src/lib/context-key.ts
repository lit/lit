/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

/**
 * The ContextKey type defines a type brand to associate a key value with the context value type
 */
export type ContextKey<KeyType, ValueType> = KeyType & {__context__: ValueType};

/**
 * A helper type which can extract a Context value type from a Context type
 */
export type ContextType<Key extends ContextKey<unknown, unknown>> =
  Key extends ContextKey<unknown, infer ValueType> ? ValueType : never;

/**
 * A helper method for creating a context key with the appropriate type
 *
 * @param key a context key value
 * @returns the context key value with the correct type
 */
export function createContext<ValueType>(key: unknown) {
  return key as ContextKey<typeof key, ValueType>;
}
