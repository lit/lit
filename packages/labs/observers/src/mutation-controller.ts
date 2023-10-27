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
 * The callback function for a MutationController.
 */
export type MutationValueCallback<T = unknown> = (
  ...args: Parameters<MutationCallback>
) => T;

/**
 * The config options for a MutationController.
 */
export interface MutationControllerConfig<T = unknown> {
  /**
   * Configuration object for the MutationObserver.
   */
  config: MutationObserverInit;
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
  callback?: MutationValueCallback<T>;
  /**
   * By default the `callback` is called without changes when a target is
   * observed. This is done to help manage initial state, but this
   * setup step can be skipped by setting this to true.
   */
  skipInitial?: boolean;
}

/**
 * MutationController is a ReactiveController that integrates a MutationObserver
 * with a ReactiveControllerHost's reactive update lifecycle. This is typically
 * a ReactiveElement or LitElement. MutationObservers can be used to detect
 * arbitrary changes to DOM, including nodes being added and remove and
 * attributes changing.
 *
 * The controller can specify a `target` element to observe and the
 * configuration options to pass to the MutationObserver. The `observe`
 * method can be called to observe additional elements.
 *
 * When a change is detected, the controller's given `callback` function is
 * used to process the result into a value which is stored on the controller.
 * The controller's `value` is usable during the host's update cycle.
 */
export class MutationController<T = unknown> implements ReactiveController {
  private _host: ReactiveControllerHost;
  private _targets = new Set<Element>();
  private _config: MutationObserverInit;
  private _observer!: MutationObserver;
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
  value?: T;
  /**
   * Function that returns a value processed from the observer's changes.
   * The result is stored in the `value` property.
   */
  callback?: MutationValueCallback<T>;
  constructor(
    host: ReactiveControllerHost & Element,
    {target, config, callback, skipInitial}: MutationControllerConfig<T>
  ) {
    this._host = host;
    // Target defaults to `host` unless explicitly `null`.
    if (target !== null) {
      this._targets.add(target ?? host);
    }
    this._config = config;
    this._skipInitial = skipInitial ?? this._skipInitial;
    this.callback = callback;
    // Check browser support.
    if (!window.MutationObserver) {
      console.warn(
        `MutationController error: browser does not support MutationObserver.`
      );
      return;
    }
    this._observer = new MutationObserver((records: MutationRecord[]) => {
      this.handleChanges(records);
      this._host.requestUpdate();
    });
    host.addController(this);
  }

  /**
   * Process the observer's changes with the controller's `callback`
   * function to produce a result stored in the `value` property.
   */
  protected handleChanges(records: MutationRecord[]) {
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

  async hostUpdated() {
    // Eagerly deliver any changes that happened during update.
    // And handle initial state as a set of 0 changes. This helps setup initial
    // state and promotes UI = f(state) since ideally the callback does not
    // rely on changes.
    const pendingRecords = this._observer.takeRecords();
    if (
      pendingRecords.length ||
      (!this._skipInitial && this._unobservedUpdate)
    ) {
      this.handleChanges(pendingRecords);
    }
    this._unobservedUpdate = false;
  }

  /**
   * Observe the target element. The controller's `target` is automatically
   * observed when the host connects.
   * @param target Element to observe
   */
  observe(target: Element) {
    this._targets.add(target);
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
