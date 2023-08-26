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
 * The callback function for a PerformanceController.
 */
export type PerformanceValueCallback<T = unknown> = (
  entries: PerformanceEntryList,
  observer: PerformanceObserver,
  entryList?: PerformanceObserverEntryList
) => T;

/**
 * The config options for a PerformanceController.
 */
export interface PerformanceControllerConfig<T = unknown> {
  /**
   * Configuration object for the PerformanceObserver.
   */
  config: PerformanceObserverInit;
  /**
   * The callback used to process detected changes into a value stored
   * in the controller's `value` property.
   */
  callback?: PerformanceValueCallback<T>;
  /**
   * By default the `callback` is called without changes when a target is
   * observed. This is done to help manage initial state, but this
   * setup step can be skipped by setting this to true.
   */
  skipInitial?: boolean;
}

/**
 * PerformanceController is a ReactiveController that integrates a
 * PerformanceObserver with a ReactiveControllerHost's reactive update
 * lifecycle. This is typically a ReactiveElement or LitElement.
 * PerformanceObserver can be used to report changes in various metrics about
 * browser and application performance, including marks and measures done with
 * the `performance` API.
 *
 * When a change is detected, the controller's given `callback` function is
 * used to process the result into a value which is stored on the controller.
 * The controller's `value` is usable during the host's update cycle.
 */
export class PerformanceController<T = unknown> implements ReactiveController {
  private _host: ReactiveControllerHost;
  private _config: PerformanceObserverInit;
  private _observer!: PerformanceObserver;
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
  callback?: PerformanceValueCallback<T>;
  constructor(
    host: ReactiveControllerHost,
    {config, callback, skipInitial}: PerformanceControllerConfig<T>
  ) {
    this._host = host;
    this._config = config;
    this._skipInitial = skipInitial ?? this._skipInitial;
    this.callback = callback;
    // Check browser support.
    if (!window.PerformanceObserver) {
      console.warn(
        `PerformanceController error: browser does not support PerformanceObserver.`
      );
      return;
    }
    this._observer = new PerformanceObserver(
      (entryList: PerformanceObserverEntryList) => {
        this.handleChanges(entryList.getEntries(), entryList);
        this._host.requestUpdate();
      }
    );
    host.addController(this);
  }

  /**
   * Process the observer's changes with the controller's `callback`
   * function to produce a result stored in the `value` property.
   */
  protected handleChanges(
    entries: PerformanceEntryList,
    entryList?: PerformanceObserverEntryList
  ) {
    this.value = this.callback?.(entries, this._observer, entryList);
  }

  hostConnected() {
    this.observe();
  }

  hostDisconnected() {
    this.disconnect();
  }

  async hostUpdated() {
    // Eagerly deliver any changes that happened during update.
    // And handle initial state as a set of 0 changes. This helps setup initial
    // state and promotes UI = f(state) since ideally the callback does not
    // rely on changes.
    const pendingEntries = this._observer.takeRecords();
    if (
      pendingEntries.length ||
      (!this._skipInitial && this._unobservedUpdate)
    ) {
      this.handleChanges(pendingEntries);
    }
    this._unobservedUpdate = false;
  }

  /**
   * Flush any pending observer updates.
   */
  flush() {
    const pendingEntries = this._observer.takeRecords();
    if (pendingEntries.length) {
      this.handleChanges(pendingEntries);
      this._host.requestUpdate();
    }
  }

  /**
   * Start observing. This is done automatically when the host connects.
   */
  observe() {
    this._observer.observe(this._config);
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
