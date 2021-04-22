/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import type * as ReactModule from 'react';
import {
  ReactiveController,
  ReactiveControllerHost,
} from '@lit/reactive-element/reactive-controller.js';

type React = typeof ReactModule;

export type ControllerConstructor<C extends ReactiveController> = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  new (...args: Array<any>): C;
};

const microtask = Promise.resolve();

/**
 * An implementation of ReactiveControllerHost that is driven by React hooks
 * and `useController()`.
 */
class ReactControllerHost<C extends ReactiveController>
  implements ReactiveControllerHost {
  /* @internal */
  _primaryController!: C;
  private _controllers: Array<ReactiveController> = [];
  private _updateCompletePromise: Promise<boolean>;
  /* @internal */
  _updatePending = true;
  private _resolveUpdate!: (value: boolean | PromiseLike<boolean>) => void;

  private _kickCount: number;
  // A function to trigger an update of the React component
  private _kick: (k: number) => void;

  constructor(kickCount: number, kick: (k: number) => void) {
    this._kickCount = kickCount;
    this._kick = kick;
    this._updateCompletePromise = new Promise((res, _rej) => {
      this._resolveUpdate = res;
    });
  }

  addController(controller: ReactiveController): void {
    this._controllers.push(controller);
  }

  removeController(controller: ReactiveController): void {
    // Note, if the indexOf is -1, the >>> will flip the sign which makes the
    // splice do nothing.
    this._controllers?.splice(this._controllers.indexOf(controller) >>> 0, 1);
  }

  requestUpdate(): void {
    if (!this._updatePending) {
      this._updatePending = true;
      // Trigger a React update by updating some state
      microtask.then(() => this._kick(this._kickCount + 1));
    }
  }

  get updateComplete(): Promise<boolean> {
    return this._updateCompletePromise;
  }

  /* @internal */
  _connected() {
    this._controllers.forEach((c) => c.hostConnected?.());
  }

  /* @internal */
  _disconnected() {
    this._controllers.forEach((c) => c.hostDisconnected?.());
  }

  /* @internal */
  _update() {
    this._controllers.forEach((c) => c.hostUpdate?.());
  }

  /* @internal */
  _updated() {
    this._updatePending = false;
    const resolve = this._resolveUpdate;
    // Create a new updateComplete Promise for the next update,
    // before resolving the current one.
    this._updateCompletePromise = new Promise((res, _rej) => {
      this._resolveUpdate = res;
    });
    this._controllers.forEach((c) => c.hostUpdated?.());
    resolve(this._updatePending);
  }
}

/**
 * Creates and stores a stateful ReactiveController instance and provides it
 * with a ReactiveControllerHost that drives the controller lifecycle.
 *
 * Use this hook to convert a ReactiveController into a React hook.
 *
 * @param React the React module that provides the base hooks. Must provide
 * `useState` and `useLayoutEffect`.
 * @param createController A function that creates a controller instance. This
 * function is given a ReactControllerHost to pass to the controller. The
 * create function is only called once per component.
 */
export const useController = <C extends ReactiveController>(
  React: React,
  createController: (host: ReactiveControllerHost) => C
): C => {
  const {useState, useLayoutEffect} = React;

  // State to force updates of the React component
  const [kickCount, kick] = useState(0);

  // Create and store the controller instance. We use useState() instead of
  // useMemo() because React does not guarantee that it will preserve values
  // created with useMemo().
  // TODO (justinfagnani): since this controller are mutable, this may cause
  // issues such as "shearing" with React concurrent mode. The solution there
  // will likely be to shapshot the controller state with something like
  // `useMutableSource`:
  // https://github.com/reactjs/rfcs/blob/master/text/0147-use-mutable-source.md
  // We can address this when React's concurrent mode is closer to shipping.
  const [host] = useState(() => {
    const host = new ReactControllerHost<C>(kickCount, kick);
    const controller = createController(host);
    host._primaryController = controller;
    host._connected();
    return host;
  });

  host._updatePending = true;

  // We use useLayoutEffect because we need updated() called synchronously
  // after rendering.
  useLayoutEffect(() => host._updated());

  // Returning a cleanup function simulates hostDisconnected timing. An empty
  // deps array tells React to only call this once: on mount with the cleanup
  // called on unmount.
  useLayoutEffect(() => () => host._disconnected(), []);

  // TODO (justinfagnani): don't call in SSR
  host._update();

  return host._primaryController;
};
