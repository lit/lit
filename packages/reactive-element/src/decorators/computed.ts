/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

/*
 * IMPORTANT: For compatibility with tsickle and the Closure JS compiler, all
 * property decorators (but not class decorators) in this file that have
 * an @ExportDecoratedItems annotation must be defined as a regular function,
 * not an arrow function.
 */

import {ReactiveElement, PropertyDeclaration} from '../reactive-element.js';
import {decorateProperty} from './base.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ComputedFunction = (...args: any[]) => unknown;
interface ComputedInfo {
  computed: ComputedFunction;
  deps: string[];
}
type ComputedPropsMap = Map<PropertyKey, ComputedInfo>;

const computedInfo: WeakMap<
  typeof ReactiveElement,
  ComputedPropsMap
> = new WeakMap();

const previousElementValues: WeakMap<
  ReactiveElement,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Map<PropertyKey, any>
> = new WeakMap();

const getPreviousValues = (el: ReactiveElement) => {
  let previousValues = previousElementValues.get(el);
  if (previousValues === undefined) {
    previousElementValues.set(el, (previousValues = new Map()));
  }
  return previousValues;
};

/**
 * Adds a computed property.
 *
 * @param computed {Function} A function which computes the property value given
 * the values of the properties identified via the deps param.
 *
 * @param deps {Array} An array of the property names of the dependencies of
 * the computed function.
 *
 * @example
 * ```ts
 * class MyElement {
 *   @property()
 *   @computed((a, b) => a + b, ['a', 'b'])
 *   computed;
 * }
 * ```
 * @category Decorator
 */
export function computed(computed: ComputedFunction, deps: string[]) {
  return decorateProperty({
    finisher: (ctor: typeof ReactiveElement, name: PropertyKey) => {
      let computedProps = computedInfo.get(ctor);
      // Setup computed properties for this class
      if (computedProps === undefined) {
        computedInfo.set(ctor, (computedProps = new Map()));
        // Returns the value of the given property. If this is a computed
        // property, its value is computed and then returned.
        // Note, a property value is only computed once per update. This
        // effectively makes computing properties a DAG.
        const computeValue = (
          el: ReactiveElement,
          name: PropertyKey,
          hasComputed: Set<ComputedInfo>,
          info?: ComputedInfo
        ) => {
          if (info !== undefined && !hasComputed.has(info)) {
            hasComputed.add(info);
            const previousValues = getPreviousValues(el);
            // Calculate if deps are dirty;
            // Note, requires manual dirty tracking.
            let depsDirty = info.deps.length === 0;
            info.deps.forEach((d: string) => {
              const previous = previousValues!.get(d);
              const depInfo = computedProps!.get(d);
              const value = computeValue(el, d, hasComputed, depInfo);
              previousValues.set(d, value);
              if (!depsDirty) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const {hasChanged} = (el.constructor as any).getPropertyOptions(
                  d
                ) as PropertyDeclaration;
                depsDirty = hasChanged!(value, previous);
              }
            });
            // Only compute if deps are dirty.
            if (depsDirty) {
              const args = info.deps.map((n: PropertyKey) =>
                computeValue(el, n, hasComputed, computedProps!.get(n))
              );
              ((el as unknown) as {[key: string]: unknown})[
                name as string
              ] = info.computed.apply(null, args);
            }
          }
          return el[name as keyof ReactiveElement];
        };

        ctor.addInitializer((el: ReactiveElement) => {
          el.addController({
            hostUpdate() {
              const hasComputed: Set<ComputedInfo> = new Set();
              computedProps!.forEach((info, name) =>
                computeValue(el, name, hasComputed, info)
              );
            },
          });
        });
      }
      computedProps.set(name, {computed, deps});
    },
  });
}
