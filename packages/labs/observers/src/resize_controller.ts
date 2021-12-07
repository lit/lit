/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
import {ReactiveControllerHost} from '@lit/reactive-element/reactive-controller.js';

export type ResizeValueCallback = (
  ...args: Parameters<ResizeObserverCallback>
) => unknown;

export interface ResizeControllerConfig {
  config?: ResizeObserverOptions;
  target?: Element;
  callback?: ResizeValueCallback;
  skipInitial?: boolean;
}

export class ResizeController {
  private _host: ReactiveControllerHost;
  private _target?: Element | null;
  private _config?: ResizeObserverOptions;
  private _observer: ResizeObserver;
  private _skipInitial = false;
  private _unobservedUpdate = false;
  value?: unknown;
  callback: ResizeValueCallback = () => true;
  constructor(
    host: ReactiveControllerHost,
    {target, config, callback, skipInitial}: ResizeControllerConfig
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
    this._observer = new ResizeObserver((entries: ResizeObserverEntry[]) => {
      this.handleChanges(entries);
      this._host.requestUpdate();
    });
    this._host.addController(this);
  }

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
