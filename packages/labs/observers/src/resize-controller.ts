/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
import {isServer} from 'lit-html/is-server.js';
import {
  ReactiveController,
  ReactiveControllerHost,
} from '@lit/reactive-element/reactive-controller.js';

/**
 * The callback function for a ResizeController.
 */
export type ResizeValueCallback<T = unknown> = (
  ...args: Parameters<ResizeObserverCallback>
) => T;

/**
 * The config options for a ResizeController.
 */
export interface ResizeControllerConfig<T = unknown> {
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
  callback?: ResizeValueCallback<T>;
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
export class ResizeController<T = unknown> implements ReactiveController {
  private _host: ReactiveControllerHost;
  private _targets = new Set<Element>();
  private _config?: ResizeObserverOptions;
  private _observer!: ResizeObserver;
  private _skipInitial = false;
  private _shouldSkipNextUpdate?: Set<Element> = undefined;
  private _isConnected = false;

  /**
   * The result of processing the observer's changes via the `callback`
   * function.
   */
  value?: T;
  /**
   * Function that returns a value processed from the observer's changes.
   * The result is stored in the `value` property.
   */
  callback?: ResizeValueCallback<T>;
  constructor(
    host: ReactiveControllerHost & Element,
    {target, config, callback, skipInitial}: ResizeControllerConfig<T>
  ) {
    this._host = host;
    this._config = config;
    this._skipInitial = skipInitial ?? this._skipInitial;
    if (this._skipInitial) {
      this._shouldSkipNextUpdate = new Set();
    }
    this.callback = callback;
    if (isServer) {
      return;
    }
    // Check browser support.
    if (!window.ResizeObserver) {
      console.warn(
        `ResizeController error: browser does not support ResizeObserver.`
      );
      return;
    }
    this._observer = new ResizeObserver((entries: ResizeObserverEntry[]) => {
      if (this._skipInitial) {
        entries = entries.filter(
          (entry) => !this._shouldSkipNextUpdate!.delete(entry.target)
        );
        if (entries.length === 0) {
          return;
        }
      }
      this.handleChanges(entries);
      this._host.requestUpdate();
    });
    // Target defaults to `host` unless explicitly `null`.
    if (target !== null) {
      // Make sure we only call observe at the end of the constructor, once all
      // the other properties are set.
      this.observe(target ?? host);
    }
    host.addController(this);
  }

  /**
   * Process the observer's changes with the controller's `callback`
   * function to produce a result stored in the `value` property.
   */
  protected handleChanges(entries: ResizeObserverEntry[]) {
    this.value = this.callback?.(entries, this._observer);
  }

  _didSetUpObservers = false;

  hostConnected() {
    this._isConnected = true;
    for (const target of this._targets) {
      this._observer.observe(target, this._config);
    }
  }

  hostDisconnected() {
    this.disconnect();
    this._isConnected = false;
  }

  /**
   * Observe the target element. The controller's `target` is automatically
   * observed when the host connects.
   * @param target Element to observe
   */
  observe(target: Element) {
    // Add to this._targets if it isn't already, to ensure it is re-observed on reconnect.
    this._targets.add(target);
    if (this._skipInitial) {
      this._shouldSkipNextUpdate!.add(target);
    }
    if (this._isConnected) {
      this._observer.observe(target, this._config);
    }
  }

  /**
   * Unobserve the target element.
   * @param target Element to unobserve
   */
  unobserve(target: Element) {
    this._targets.delete(target);
    this._shouldSkipNextUpdate?.delete(target);
    if (this._isConnected) {
      this._observer.unobserve(target);
    }
  }

  /**
   * Disconnects the observer. This is done automatically when the host
   * disconnects.
   */
  protected disconnect() {
    this._observer.disconnect();
  }
}
