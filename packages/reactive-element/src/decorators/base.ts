/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {
  ReactiveElement,
  ReactiveElementConstructor,
} from '../reactive-element.js';

export type Constructor<T> = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  new (...args: any[]): T;
};

// From the TC39 Decorators proposal
export interface ClassDescriptor {
  kind: 'class';
  elements: ClassElement[];
  finisher?: <T>(clazz: Constructor<T>) => undefined | Constructor<T>;
}

// From the TC39 Decorators proposal
export interface ClassElement {
  kind: 'field' | 'method';
  key: PropertyKey;
  placement: 'static' | 'prototype' | 'own';
  initializer?: Function;
  extras?: ClassElement[];
  finisher?: <T>(clazz: Constructor<T>) => undefined | Constructor<T>;
  descriptor?: PropertyDescriptor;
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

export const decorateProperty = (
  decorator: (ctor: ReactiveElementConstructor, property: PropertyKey) => void
) => (
  protoOrDescriptor: ReactiveElement | ClassElement,
  name?: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): void | any => {
  if (name !== undefined) {
    const ctor = (protoOrDescriptor as ReactiveElement)
      .constructor as ReactiveElementConstructor;
    return decorator(ctor, name!);
  } else {
    return {
      ...protoOrDescriptor,
      finisher(ctor: ReactiveElementConstructor) {
        decorator(ctor, (protoOrDescriptor as ClassElement).key);
      },
    };
  }
};
