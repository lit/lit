/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
import {ReactiveControllerHost} from '@lit/reactive-element/reactive-controller.js';

interface IObserver {
  observe(element: Element): void;
  takeRecords?: () => unknown[];
  disconnect(): void;
}

export interface BaseControllerConfig {
  /**
   * The element to observe. In addition to configuring the target here,
   * the `observe` method can be called to observe additional targets. When not
   * specified, the target defaults to the `host`. If set to `null`, no target
   * is automatically observed. Only the configured target will be re-observed
   * if the host connects again after unobserving via disconnection.
   */
  target?: Element | null;
  /**
   * By default the `callback` is called without changes when a target is
   * observed. This is done to help manage initial state, but this
   * setup step can be skipped by setting this to true.
   */
  skipInitial?: boolean;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export class BaseController<Config, Callback extends (...args: any) => any> {
  protected _host: ReactiveControllerHost;
  protected _targets: Set<Element> = new Set();
  protected _config?: Config;
  protected _observer!: IObserver;
  protected _skipInitial = false;
  /**
   * Flag used to help manage calling the `callback` when observe is called
   * and `skipInitial` is set to true. Note that unlike the other observers
   * IntersectionObserver *does* report its initial state (e.g. whether or not
   * there is an intersection). This flag is used to avoid handling this
   * state if `skipInitial` is true.
   */
  protected _unobservedUpdate = false;
  /**
   * Function that returns a value processed from the observer's changes.
   * The result is stored in the `value` property.
   */
  callback?: Callback;
  /**
   * The result of processing the observer's changes via the `callback`
   * function.
   */
  value?: ReturnType<Callback>;
  constructor(
    host: ReactiveControllerHost & Element,
    {
      config,
      skipInitial,
      callback,
      target,
    }: {config?: Config; callback?: Callback} & BaseControllerConfig
  ) {
    this._host = host;
    this._skipInitial = skipInitial ?? this._skipInitial;
    this._config = config;
    this.callback = callback;
    // Target defaults to `host` unless explicitly `null`.
    if (target !== null) {
      this._targets.add(target ?? host);
    }
  }

  /**
   * Observe the target element. The controller's `target` is automatically
   * observed when the host connects.
   * @param target Element to observe
   */
  observe(target: Element) {
    this._targets.add(target);
    this._observer.observe(target);
    this._unobservedUpdate = true;
    this._host.requestUpdate();
  }

  /**
   * Process the observer's changes with the controller's `callback`
   * function to produce a result stored in the `value` property.
   */
  protected handleChanges(records: Parameters<Callback>[0]) {
    this.value = this.callback?.(records, this._observer);
  }

  hostConnected() {
    for (const target of this._targets) {
      this.observe(target);
    }
  }

  hostDisconnected() {
    this.disconnect();
  }

  /**
   * Disconnects the observer. This is done automatically when the host
   * disconnects.
   */
  protected disconnect() {
    this._observer.disconnect();
  }
}
