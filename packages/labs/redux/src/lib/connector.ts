/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import type {
  ReactiveController,
  ReactiveControllerHost,
} from '@lit/reactive-element';
import type {Store} from '@reduxjs/toolkit';
import {ContextConsumer} from '@lit/context';
import {storeContext} from './store-context.js';
import {type EqualityCheck, tripleEquals} from './equality.js';

/**
 * Selector function that takes state and returns a selected value.
 */
export type Selector<S, V> = (state: S) => V;

/**
 * Options for thet Connector reactive controller.
 */
export type ConnectorOptions<S extends Store, V> = {
  /**
   * Selector function that takes state and returns a selected value. May use a
   * memoized selector like one created with `reselect`.
   *
   * If none is provided, the controller will not subscribe to Redux store
   * changes nor provide any selected value. Do this if you only wish to bring
   * in the `dispatch` method to the component.
   */
  selector?: Selector<ReturnType<S['getState']>, V>;
  /**
   * Function used to check whether a selected value is different from
   * previously selected value.
   *
   * Defaults to triple equals which will suffice for directly selecting values
   * out of the state that's updating with immutable pattern, or if using a
   * memoized selector using a library like `reselect`.
   *
   * Provide a custom function here if the selector returns derived data
   * that's not memoized.
   */
  equalityCheck?: EqualityCheck;
};

/**
 * Reactive controller which subscribes to a Redux store and ties changes to a
 * custom element's reactive life cycle.
 *
 * This controller must be used with a provider that supplies the Redux store
 * using the `storeContext` from this package using the [Context
 * Protocol](https://github.com/webcomponents-cg/community-protocols/blob/main/proposals/context.md).
 */
export class Connector<S extends Store, V> implements ReactiveController {
  private _host: ReactiveControllerHost & HTMLElement;
  private _store!: S;
  private _selector: ConnectorOptions<S, V>['selector'];
  private _equalityCheck: EqualityCheck;
  private _unsubscribe?: () => void;
  private _selected?: V;

  /**
   * Static method to create a typed version of the `Connector` constructor.
   * This allows type checking for the `selector` option, the selected value, as
   * well as the `dispatch` method provided by the connector.
   *
   * @example
   *
   * ```ts
   * // `AppStore` type gotten from created Redux store
   * export const AppConnector = Connector.withStoreType<AppStore>();
   *
   * // Usage within component – `state` will already be typed
   * new AppConnector(this, {selector: (state) => state.counter.value});
   * ```
   */
  static withStoreType<S extends Store>(): new <V>(
    host: ReactiveControllerHost & HTMLElement,
    options?: ConnectorOptions<S, V>
  ) => Connector<S, V> {
    return this;
  }

  /**
   * Selected value.
   */
  get selected() {
    return this._selected as V;
  }

  /**
   * Method to dispatch an action to the store.
   */
  get dispatch(): S['dispatch'] {
    return (action) => this._store.dispatch(action);
  }

  constructor(
    host: ReactiveControllerHost & HTMLElement,
    options?: ConnectorOptions<S, V>
  ) {
    this._host = (host.addController(this), host);
    this._selector = options?.selector;
    this._equalityCheck = options?.equalityCheck ?? tripleEquals;
  }

  hostConnected() {
    new ContextConsumer(this._host, {
      context: storeContext,
      subscribe: true,
      callback: (store) => {
        this._store = store as S;
      },
    });
    if (this._store === undefined) {
      throw new Error(
        'Connector must be used in a component below a context provider that ' +
          'provides a Redux store.'
      );
    }
    if (this._selector !== undefined) {
      this._selected = this._selector(this._store.getState());
      this._unsubscribe = this._store.subscribe(() => {
        const selected = this._selector!(this._store.getState());
        if (!this._equalityCheck(this._selected, selected)) {
          this._selected = selected;
          this._host.requestUpdate();
        }
      });
    }
  }

  hostDisconnected() {
    this._unsubscribe?.();
  }
}
