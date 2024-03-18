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

export type EqualityCheck = (a: unknown, b: unknown) => boolean;
export type SelectorFunction<S, V> = (state: S) => V;

export type SelectorOptions<S extends Store, V> = {
  selector: SelectorFunction<ReturnType<S['getState']>, V>;
  equalityCheck?: EqualityCheck;
};

export class Selector<S extends Store, V> implements ReactiveController {
  private _host: ReactiveControllerHost & HTMLElement;
  private _store!: S;
  private _selector: SelectorOptions<S, V>['selector'];
  private _equalityCheck: EqualityCheck;
  private _unsubscribe!: () => void;
  private _value!: V;

  static withStoreType<S extends Store>(): new <V>(
    host: ReactiveControllerHost & HTMLElement,
    options: SelectorOptions<S, V>
  ) => Selector<S, V> {
    return this;
  }

  get value(): V {
    return this._value;
  }

  get dispatch(): S['dispatch'] {
    return (action) => this._store.dispatch(action);
  }

  constructor(
    host: ReactiveControllerHost & HTMLElement,
    options: SelectorOptions<S, V>
  ) {
    const {selector, equalityCheck = tripleEquals} = options;
    this._host = (host.addController(this), host);
    this._selector = selector;
    this._equalityCheck = equalityCheck;
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
        'Selector must be used in a component below a context provider that ' +
          'provides a Redux store.'
      );
    }
    this._value = this._selector(this._store.getState());
    this._unsubscribe = this._store.subscribe(() => {
      const selected = this._selector(this._store.getState());
      if (!this._equalityCheck(this.value, selected)) {
        this._value = selected;
        this._host.requestUpdate();
      }
    });
  }

  hostDisconnected() {
    this._unsubscribe();
  }
}

export const tripleEquals: EqualityCheck = (a, b) => a === b;

export const shallowEquals: EqualityCheck = (a, b) => {
  if (a === b) {
    return true;
  }

  if (
    typeof a !== 'object' ||
    typeof b !== 'object' ||
    a === null ||
    b === null
  ) {
    return false;
  }

  const keys = Object.keys(a);
  if (keys.length !== Object.keys(b).length) {
    return false;
  }

  for (const k of keys) {
    if (
      (a as Record<string, unknown>)[k] !== (b as Record<string, unknown>)[k]
    ) {
      return false;
    }
  }

  return true;
};
