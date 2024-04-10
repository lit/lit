/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {ReactiveElement} from '@lit/reactive-element';
import {Connector, type ConnectorOptions} from './connector.js';
import type {Store} from '@reduxjs/toolkit';

type Select = {
  /**
   * Decorator for subscribing to a Redux store and select a value from it. On
   * state change resulting in a new value, the decorated property will contain
   * the new value and the component will re-render. Must use in a component
   * that has the store provided in a context.
   *
   * @param selector Function that takes state and returns a selected value to
   * be accessable.
   * @param equalityCheck Function that compares selected value with a previous
   * one. Defaults to triple equals. Provide a custom function if the selector
   * returns a computed value that requires bespoke checking and is not
   * memoized.
   */
  <S extends Store, V>(
    selector: NonNullable<ConnectorOptions<S, V>['selector']>,
    equalityCheck?: ConnectorOptions<S, V>['equalityCheck']
  ): SelectDecorator;

  /**
   * Decorator for subscribing  to a Redux store and select a value from it. On
   * state change resulting in a new value, the decorated property will contain
   * the new value and the component will re-render. Must use in a component
   * that has the store provided in a context.
   *
   * @param {ConnectorOptions} options Options passed to underlying `Connector`
   * controller.
   * @param options.selector Function that takes state and returns a selected
   * value to be accessable.
   * @param options.equalityCheck Function that compares selected value with a
   * previous one. Defaults to triple equals. Provide a custom function if the
   * selector returns a computed value that requires bespoke checking and is not
   * memoized.
   */
  <S extends Store, V>(options: ConnectorOptions<S, V>): SelectDecorator;
};

export const select: Select = <S extends Store, V>(
  selectorOrOptions:
    | NonNullable<ConnectorOptions<S, V>['selector']>
    | ConnectorOptions<S, V>,
  equalityCheck?: ConnectorOptions<S, V>['equalityCheck']
): SelectDecorator => {
  return function <C extends ReactiveElement>(
    protoOrTarget: ClassAccessorDecoratorTarget<C, V>,
    nameOrContext: PropertyKey | ClassAccessorDecoratorContext<C, V>
  ) {
    let options: ConnectorOptions<S, V> = {};
    if (typeof selectorOrOptions === 'object') {
      options = selectorOrOptions;
    } else {
      options.selector = selectorOrOptions;
      options.equalityCheck = equalityCheck;
    }
    // Map of instances to controllers
    const controllerMap = new WeakMap<ReactiveElement, Connector<S, V>>();
    if (typeof nameOrContext === 'object') {
      // Standard decorators branch
      nameOrContext.addInitializer(function (this: ReactiveElement) {
        controllerMap.set(this, new Connector(this, options));
      });
      return {
        get(this: ReactiveElement) {
          return controllerMap.get(this)!.selected;
        },
      };
    } else {
      // Experimental decorators branch
      (protoOrTarget!.constructor as typeof ReactiveElement).addInitializer(
        (element: ReactiveElement): void => {
          controllerMap.set(element, new Connector(element, options));
        }
      );
      const descriptor = {
        get(this: ReactiveElement) {
          return controllerMap.get(this)!.selected;
        },
      };
      Object.defineProperty(protoOrTarget, nameOrContext, descriptor);
      return descriptor;
    }
  };
};

/**
 * Decorator to obtain a dispatch method from the Redux store. Must use in a
 * component that has the store provided in a context.
 */
export const dispatch = <S extends Store>(): DispatchDecorator => {
  return function <C extends ReactiveElement>(
    protoOrTarget: ClassAccessorDecoratorTarget<C, S['dispatch']> | undefined,
    nameOrContext:
      | PropertyKey
      | ClassAccessorDecoratorContext<C, S['dispatch']>
      | ClassFieldDecoratorContext<C, S['dispatch']>
  ) {
    // Map of instances to controllers
    const controllerMap = new WeakMap<ReactiveElement, Connector<S, never>>();
    if (typeof nameOrContext === 'object') {
      // Standard decorators branch
      if (nameOrContext.kind === 'field') {
        return function (this: ReactiveElement) {
          controllerMap.set(this, new Connector(this));
          return controllerMap.get(this)!.dispatch;
        };
      } else {
        // accessor
        nameOrContext.addInitializer(function (this: ReactiveElement) {
          controllerMap.set(this, new Connector(this));
        });
        return {
          get(this: ReactiveElement) {
            return controllerMap.get(this)!.dispatch;
          },
        };
      }
    } else {
      // Experimental decorators branch
      (protoOrTarget!.constructor as typeof ReactiveElement).addInitializer(
        (element: ReactiveElement): void => {
          controllerMap.set(element, new Connector(element));
        }
      );
      const descriptor = {
        get(this: ReactiveElement) {
          return controllerMap.get(this)!.dispatch;
        },
      };
      Object.defineProperty(protoOrTarget, nameOrContext, descriptor);
      return descriptor;
    }
  };
};

/**
 * Generates a public interface type that removes private and protected fields.
 * This allows accepting otherwise compatible versions of the type (e.g. from
 * multiple copies of the same package in `node_modules`).
 */
type Interface<T> = {
  [K in keyof T]: T[K];
};

type SelectDecorator = {
  // legacy
  <
    K extends PropertyKey,
    Proto extends Interface<Omit<ReactiveElement, 'renderRoot'>>,
  >(
    protoOrDescriptor: Proto,
    name: K,
    descriptor?: PropertyDescriptor
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ): any;

  // standard
  <C extends Interface<Omit<ReactiveElement, 'renderRoot'>>, V>(
    value: ClassAccessorDecoratorTarget<C, V>,
    context: ClassAccessorDecoratorContext<C, V>
  ): void;
};

type DispatchDecorator = {
  // legacy
  <
    K extends PropertyKey,
    Proto extends Interface<Omit<ReactiveElement, 'renderRoot'>>,
  >(
    protoOrDescriptor: Proto,
    name: K,
    descriptor?: PropertyDescriptor
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ): any;

  // standard
  <C extends Interface<Omit<ReactiveElement, 'renderRoot'>>, V>(
    value: ClassAccessorDecoratorTarget<C, V> | undefined,
    context:
      | ClassAccessorDecoratorContext<C, V>
      | ClassFieldDecoratorContext<C, V>
  ): void;
};
