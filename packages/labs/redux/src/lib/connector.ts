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

export type Selector<S, V> = (state: S) => V;

export type ConnectorOptions<S extends Store, V> = {
  selector?: Selector<ReturnType<S['getState']>, V>;
  equalityCheck?: EqualityCheck;
};

export class Connector<S extends Store, V> implements ReactiveController {
  private _host: ReactiveControllerHost & HTMLElement;
  private _store!: S;
  private _selector: ConnectorOptions<S, V>['selector'];
  private _equalityCheck: EqualityCheck;
  private _unsubscribe!: () => void;
  private _selected?: V;

  static withStoreType<S extends Store>(): new <V>(
    host: ReactiveControllerHost & HTMLElement,
    options?: ConnectorOptions<S, V>
  ) => Connector<S, V> {
    return this;
  }

  get selected() {
    // Type V will be unknown of no selector was provided to the constructor.
    return this._selected as V;
  }

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
    this._selected = this._selector?.(this._store.getState());
    this._unsubscribe = this._store.subscribe(() => {
      if (this._selector !== undefined) {
        const selected = this._selector(this._store.getState());
        if (!this._equalityCheck(this._selected, selected)) {
          this._selected = selected;
          this._host.requestUpdate();
        }
      }
    });
  }

  hostDisconnected() {
    this._unsubscribe();
  }
}
