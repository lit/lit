/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
import {ReactiveControllerHost} from '@lit/reactive-element/reactive-controller.js';

export type ValueCallback = (records: MutationRecord[]) => unknown;

export interface MutationControllerConfig {
  config: MutationObserverInit;
  target?: Element;
  callback?: ValueCallback;
  skipInitial?: boolean;
}

export class MutationController {
  private _host: ReactiveControllerHost;
  private _target?: Element | null;
  private _config: MutationObserverInit;
  private _observer: MutationObserver;
  private _skipInitial = false;
  private _unobservedUpdate = false;
  value?: unknown;
  callback: ValueCallback = () => true;
  constructor(
    host: ReactiveControllerHost,
    {target, config, callback, skipInitial}: MutationControllerConfig
  ) {
    this._host = host;
    this._target = target;
    this._config = config;
    if (skipInitial !== undefined) {
      this._skipInitial = skipInitial;
    }
    if (callback !== undefined) {
      this.callback = callback;
    }
    this._observer = new MutationObserver((records: MutationRecord[]) => {
      this.handleChanges(records);
      this._host.requestUpdate();
    });
    this._host.addController(this);
  }

  protected handleChanges(records: MutationRecord[]) {
    this.value = this.callback(records);
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
   * Observe the target element.
   * @param target Element to observe
   */
  observe(target: Element) {
    this._observer.observe(target, this._config);
    this._unobservedUpdate = true;
    this._host.requestUpdate();
  }

  protected disconnect() {
    this._observer.disconnect();
  }
}
