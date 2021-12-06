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
}

export class MutationController {
  _host: ReactiveControllerHost;
  _target?: Element | null;
  _config: MutationObserverInit;
  _observer: MutationObserver;
  value?: unknown;
  callback: ValueCallback = () => true;
  constructor(
    host: ReactiveControllerHost,
    {target, config, callback}: MutationControllerConfig
  ) {
    this._host = host;
    this._target = target;
    this._config = config;
    if (callback !== undefined) {
      this.callback = callback;
    }
    this._observer = new MutationObserver((records: MutationRecord[]) => {
      this.value = this.callback(records);
      this._host.requestUpdate();
    });
    this._host.addController(this);
  }

  hostConnected() {
    if (this._target) {
      this.observe(this._target);
    }
  }

  hostDisconnected() {
    this.disconnect();
  }

  observe(target: Element) {
    this._observer.observe(target, this._config);
  }

  disconnect() {
    this._observer.disconnect();
  }
}
