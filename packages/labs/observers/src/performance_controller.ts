/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
import {ReactiveControllerHost} from '@lit/reactive-element/reactive-controller.js';

export type PerformanceValueCallback = (
  entries: PerformanceEntryList,
  observer: PerformanceObserver,
  entryList?: PerformanceObserverEntryList
) => unknown;

export interface PerformanceControllerConfig {
  config: PerformanceObserverInit;
  callback?: PerformanceValueCallback;
  skipInitial?: boolean;
}

export class PerformanceController {
  private _host: ReactiveControllerHost;
  private _config: PerformanceObserverInit;
  private _observer: PerformanceObserver;
  private _skipInitial = false;
  private _unobservedUpdate = false;
  value?: unknown;
  callback: PerformanceValueCallback = () => true;
  constructor(
    host: ReactiveControllerHost,
    {config, callback, skipInitial}: PerformanceControllerConfig
  ) {
    this._host = host;
    this._config = config;
    if (skipInitial !== undefined) {
      this._skipInitial = skipInitial;
    }
    if (callback !== undefined) {
      this.callback = callback;
    }
    this._observer = new PerformanceObserver(
      (entryList: PerformanceObserverEntryList) => {
        this.handleChanges(entryList.getEntries(), entryList);
        this._host.requestUpdate();
      }
    );
    this._host.addController(this);
  }

  protected handleChanges(
    entries: PerformanceEntryList,
    entryList?: PerformanceObserverEntryList
  ) {
    this.value = this.callback(entries, this._observer, entryList);
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
   * Observe the target element.
   * @param target Element to observe
   */
  observe() {
    this._observer.observe(this._config);
    this._unobservedUpdate = true;
    this._host.requestUpdate();
  }

  protected disconnect() {
    this._observer.disconnect();
  }
}
