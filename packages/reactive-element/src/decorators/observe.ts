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

type ObserveFunction = (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  value: any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  oldValue: any,
  name: PropertyKey
) => void;

type ObservedPropsMap = Map<PropertyKey, ObserveFunction>;

const observedInfo: WeakMap<
  typeof ReactiveElement,
  ObservedPropsMap
> = new WeakMap();

// Note, previous values are not provided via `hostUpdated`
// but are needed here. Therefore, tracking is done manually.
const previousValues: WeakMap<
  ReactiveElement,
  Map<PropertyKey, unknown>
> = new WeakMap();
const getAndUpdatePreviousValue = (
  el: ReactiveElement,
  name: PropertyKey,
  value: unknown
) => {
  let previousProps = previousValues.get(el);
  if (previousProps === undefined) {
    previousValues.set(el, (previousProps = new Map()));
  }
  const previous = previousProps.get(name);
  previousProps.set(name, value);
  return previous;
};

/**
 * Adds a property value observer.
 *
 * @param observe {ObserveFunction} A function which observes the property value
 * change. It is passed the current and previous value as well as the name
 * of the property.
 *
 * @example
 * ```ts
 * class MyElement {
 *   @property()
 *   @observe((value, previous, name) => {
 *     const max = 5;
 *     if (value > max) {
 *       this[name] = previous;
 *       console.log(`Element of type ${this.localName}, property ${name}
 *         with value '${value}' exceeded maximum of '${max}', resetting
 *         to '${previous}'.`)
 *     }
 *   })
 *   observedProp;
 * }
 * ```
 * @category Decorator
 */
export function observe(observer: ObserveFunction) {
  return decorateProperty({
    finisher: (ctor: typeof ReactiveElement, name: PropertyKey) => {
      let observedProps = observedInfo.get(ctor);
      // Setup observed properties for this class
      if (observedProps === undefined) {
        observedInfo.set(ctor, (observedProps = new Map()));
        ctor.addInitializer((el: ReactiveElement) => {
          el.addController({
            hostUpdated() {
              observedProps!.forEach((observer, name) => {
                const value = el[name as keyof ReactiveElement];
                const previous = getAndUpdatePreviousValue(el, name, value);
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const {hasChanged} = (el.constructor as any).getPropertyOptions(
                  name
                ) as PropertyDeclaration;
                if (hasChanged!(value, previous)) {
                  observer.call(el, value, previous, name);
                }
              });
            },
          });
        });
      }
      observedProps.set(name, observer);
    },
  });
}
