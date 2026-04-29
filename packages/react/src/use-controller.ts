/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import type {
  ReactiveController,
  ReactiveControllerHost,
} from '@lit/reactive-element/reactive-controller.js';

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
  implements ReactiveControllerHost
{
  /* @internal */
  _primaryController!: C;
  private _controllers: Array<ReactiveController> = [];
  private _updateCompletePromise: Promise<boolean>;
  /* @internal */
  _updatePending = true;
  private _resolveUpdate!: (value: boolean | PromiseLike<boolean>) => void;

  /* @internal */
  _isConnected = false;

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
      microtask.then(() => this._kick(++this._kickCount));
    }
  }

  get updateComplete(): Promise<boolean> {
    return this._updateCompletePromise;
  }

  /* @internal */
  _connected() {
    this._isConnected = true;
    this._controllers.forEach((c) => c.hostConnected?.());
  }

  /* @internal */
  _disconnected() {
    this._isConnected = false;
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
  React: typeof window.React,
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
  // will likely be to snapshot the controller state with something like
  // `useMutableSource`:
  // https://github.com/reactjs/rfcs/blob/master/text/0147-use-mutable-source.md
  // We can address this when React's concurrent mode is closer to shipping.

  let shouldDisconnect = false;
  const [host] = useState(() => {
    const host = new ReactControllerHost<C>(kickCount, kick);
    const controller = createController(host);
    host._primaryController = controller;
    // Note, calls to `useState` are expected to produce no side effects and in
    // StrictMode this is enforced by not running effects for the first render.
    //
    // This happens in StrictMode:
    // 1. Throw away render: component function runs but does not call effects
    // 2. Real render: component function runs and *does* call effects,
    // 2.a. if first render, run effects and
    // 2.a.1 mount,
    // 2.a.2 unmount,
    // 2.a.3 remount
    // 2b. if not first render, just run effects
    //
    // To preserve update lifecycle ordering and run it before this hook
    // returns, run connected here but schedule and async disconnect (handles
    // lifecycle balance for `(1) Throw away render`).
    // The disconnect is cancelled if the effects actually run (handles
    // `(2.a.1) Real render, mount`).
    host._connected();
    shouldDisconnect = true;
    microtask.then(() => {
      if (shouldDisconnect) {
        host._disconnected();
      }
    });
    return host;
  });

  host._updatePending = true;

  // This effect runs only on mount/unmount of the component (via the empty
  // deps array). If the controller has just been created, it's scheduled
  // a disconnect so that it behaves correctly in StrictMode (see above).
  // The returned callback here disconnects the host when the component is
  // unmounted (handles `(2.a.2) Real render, unmount` above).
  // And finally, if the component is disconnected when the effect runs, we
  // connect it (handles `(2.a.3) Real render, remount`).
  useLayoutEffect(() => {
    shouldDisconnect = false;
    if (!host._isConnected) {
      host._connected();
    }
    return () => host._disconnected();
  }, []);

  // We use useLayoutEffect because we need updated() called synchronously
  // after rendering.
  useLayoutEffect(() => host._updated());

  // TODO (justinfagnani): don't call in SSR
  host._update();

  return host._primaryController;
};
