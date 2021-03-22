/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {ReactiveElement} from '../reactive-element.js';

export type Constructor<T> = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  new (...args: any[]): T;
};

// From the TC39 Decorators proposal
export interface ClassDescriptor {
  kind: 'class';
  elements: ClassElement[];
  finisher?: <T>(clazz: Constructor<T>) => void | Constructor<T>;
}

export interface ClassElementPropertyDescriptor extends PropertyDescriptor {
  initializer?: () => unknown;
}

// From the TC39 Decorators proposal
export interface ClassElement {
  kind: 'field' | 'method';
  key: PropertyKey;
  placement: 'static' | 'prototype' | 'own';
  initializer?: Function;
  extras?: ClassElement[];
  finisher?: <T>(clazz: Constructor<T>) => void | Constructor<T>;
  descriptor?: ClassElementPropertyDescriptor;
}

export const legacyPrototypeMethod = (
  descriptor: PropertyDescriptor,
  proto: Object,
  name: PropertyKey
) => {
  Object.defineProperty(proto, name, descriptor);
};

export const standardPrototypeMethod = (
  descriptor: PropertyDescriptor,
  element: ClassElement
) => ({
  kind: 'method',
  placement: 'prototype',
  key: element.key,
  descriptor,
});

/**
 * Helper for decorating a property that is compatible with both TypeScript
 * and Babel decorators. The optional `finisher` can be used to perform work on
 * the class. The optional `descriptor` should return a PropertyDescriptor
 * to install for the given property.
 *
 * @param finisher {(ctor: typeof ReactiveElement, property: PropertyKey) => void)} Optional finisher
 * @param descriptor {(property: PropertyKey) => PropertyDescriptor} Optional descriptor generator
 * @returns {ClassElement|void}
 */
export const decorateProperty = ({
  finisher,
  descriptor,
}: {
  finisher?:
    | ((ctor: typeof ReactiveElement, property: PropertyKey) => void)
    | null;
  descriptor?: (property: PropertyKey) => PropertyDescriptor;
}) => (
  protoOrDescriptor: ReactiveElement | ClassElement,
  name?: string,
  legacyDescriptor?: ClassElementPropertyDescriptor
  // Note TypeScript requires the return type to be `void|any`
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): void | any => {
  // TypeScript / Babel legacy mode
  if (name !== undefined) {
    const ctor = (protoOrDescriptor as ReactiveElement)
      .constructor as typeof ReactiveElement;
    let desc = legacyDescriptor;
    if (descriptor !== undefined) {
      desc = descriptor(name);
      Object.defineProperty(protoOrDescriptor, name, desc);
    }
    finisher?.(ctor, name!);
    if (legacyDescriptor?.initializer != undefined) {
      ctor.addInitializer((e: ReactiveElement) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (e as any)[name] = legacyDescriptor.initializer!();
      });
    }
    // Return value used in Babel legacy mode and ignored in TypeScript
    return desc;
    // Babel standard mode
  } else {
    // Note, the @property decorator saves `key` as `originalKey`
    // so try to use it here.
    const key =
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (protoOrDescriptor as any).originalKey ??
      (protoOrDescriptor as ClassElement).key;
    const info: ClassElement =
      descriptor != undefined
        ? {
            kind: 'method',
            placement: 'prototype',
            key,
            descriptor: descriptor((protoOrDescriptor as ClassElement).key),
          }
        : {...(protoOrDescriptor as ClassElement), key};
    if (finisher != undefined) {
      info.finisher = function <ReactiveElement>(
        ctor: Constructor<ReactiveElement>
      ) {
        finisher((ctor as unknown) as typeof ReactiveElement, key);
      };
    }
    return info;
  }
};
