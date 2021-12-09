/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
import {
  ReactiveController,
  ReactiveControllerHost,
} from '@lit/reactive-element/reactive-controller.js';

/**
 * The callback function for a ResizeController.
 */
export type ResizeValueCallback = (
  ...args: Parameters<ResizeObserverCallback>
) => unknown;

/**
 * The config options for a ResizeController.
 */
export interface ResizeControllerConfig {
  /**
   * Configuration object for the ResizeController.
   */
  config?: ResizeObserverOptions;
  /**
   * The element to observe. In addition to configuring the target here,
   * the `observe` method can be called to observe additional targets. When not
   * specified, the target defaults to the `host`. If set to `null`, no target
   * is automatically observed. Only the configured target will be re-observed
   * if the host connects again after unobserving via disconnection.
   */
  target?: Element | null;
  /**
   * The callback used to process detected changes into a value stored
   * in the controller's `value` property.
   */
  callback?: ResizeValueCallback;
  /**
   * By default the `callback` is called without changes when a target is
   * observed. This is done to help manage initial state, but this
   * setup step can be skipped by setting this to true.
   */
  skipInitial?: boolean;
}

/**
 * ResizeController is a ReactiveController that integrates a ResizeObserver
 * with a ReactiveControllerHost's reactive update lifecycle. This is typically
 * a ReactiveElement or LitElement. ResizeObservers can be used to detect
 * size changes to DOM elements.
 *
 * The controller can specify a `target` element to observe and the
 * configuration options to pass to the ResizeObserver. The `observe`
 * method can be called to observe additional elements.
 *
 * When a change is detected, the controller's given `callback` function is
 * used to process the result into a value which is stored on the controller.
 * The controller's `value` is usable during the host's update cycle.
 */
export class ResizeController implements ReactiveController {
  private _host: ReactiveControllerHost;
  private _target: Element | null;
  private _config?: ResizeObserverOptions;
  private _observer: ResizeObserver;
  private _skipInitial = false;
  /**
   * Flag used to help manage calling the `callback` when observe is called
   * in addition to when a mutation occurs. This is done to help setup initial
   * state and is performed async by requesting a host update and calling
   * `handleChanges` once by checking and then resetting this flag.
   */
  private _unobservedUpdate = false;
  /**
   * The result of processing the observer's changes via the `callback`
   * function.
   */
  value?: unknown;
  /**
   * Function that returns a value processed from the observer's changes.
   * The result is stored in the `value` property.
   */
  callback: ResizeValueCallback = () => true;
  constructor(
    host: ReactiveControllerHost,
    {target, config, callback, skipInitial}: ResizeControllerConfig
  ) {
    (this._host = host).addController(this);
    // Target defaults to `host` unless explicitly `null`.
    this._target =
      target === null ? target : target ?? (this._host as unknown as Element);
    this._config = config;
    this._skipInitial = skipInitial ?? this._skipInitial;
    this.callback = callback ?? this.callback;
    this._observer = new ResizeObserver((entries: ResizeObserverEntry[]) => {
      this.handleChanges(entries);
      this._host.requestUpdate();
    });
  }

  /**
   * Process the observer's changes with the controller's `callback`
   * function to produce a result stored in the `value` property.
   */
  protected handleChanges(entries: ResizeObserverEntry[]) {
    this.value = this.callback(entries, this._observer);
  }

  hostConnected() {
    if (this._target) {
      this.observe(this._target);
    }
  }

  hostDisconnected() {
    this.disconnect();
  }

  async hostUpdated() {
    // Handle initial state as a set of 0 changes. This helps setup initial
    // state and promotes UI = f(state) since ideally the callback does not
    // rely on changes.
    if (!this._skipInitial && this._unobservedUpdate) {
      this.handleChanges([]);
    }
    this._unobservedUpdate = false;
  }

  /**
   * Observe the target element. The controller's `target` is automatically
   * observed when the host connects.
   * @param target Element to observe
   */
  observe(target: Element) {
    this._observer.observe(target, this._config);
    this._unobservedUpdate = true;
    this._host.requestUpdate();
  }

  /**
   * Disconnects the observer. This is done automatically when the host
   * disconnects.
   */
  protected disconnect() {
    this._observer.disconnect();
  }
}
