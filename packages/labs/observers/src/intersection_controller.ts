/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
import {ReactiveControllerHost} from '@lit/reactive-element/reactive-controller.js';

export type IntersectionValueCallback = (
  ...args: Parameters<IntersectionObserverCallback>
) => unknown;

export interface IntersectionControllerConfig {
  config?: IntersectionObserverInit;
  target?: Element;
  callback?: IntersectionValueCallback;
  skipInitial?: boolean;
}

export class IntersectionController {
  private _host: ReactiveControllerHost;
  private _target?: Element | null;
  private _observer: IntersectionObserver;
  private _skipInitial = false;
  private _unobservedUpdate = false;
  value?: unknown;
  callback: IntersectionValueCallback = () => true;
  constructor(
    host: ReactiveControllerHost,
    {target, config, callback, skipInitial}: IntersectionControllerConfig
  ) {
    this._host = host;
    this._target = target;
    if (skipInitial !== undefined) {
      this._skipInitial = skipInitial;
    }
    if (callback !== undefined) {
      this.callback = callback;
    }
    this._observer = new IntersectionObserver(
      (entries: IntersectionObserverEntry[]) => {
        const unobservedUpdate = this._unobservedUpdate;
        this._unobservedUpdate = false;
        if (this._skipInitial && unobservedUpdate) {
          return;
        }
        this.handleChanges(entries);
        this._host.requestUpdate();
      },
      config
    );
    this._host.addController(this);
  }

  protected handleChanges(entries: IntersectionObserverEntry[]) {
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
    // Eagerly deliver any changes that happened during update.
    const pendingRecords = this._observer.takeRecords();
    if (pendingRecords.length) {
      this.handleChanges(pendingRecords);
    }
  }

  /**
   * Observe the target element.
   * @param target Element to observe
   */
  observe(target: Element) {
    // Note, this will always trigger the callback since the initial
    // intersection state is reported.
    this._observer.observe(target);
    this._unobservedUpdate = true;
  }

  protected disconnect() {
    this._observer.disconnect();
  }
}
