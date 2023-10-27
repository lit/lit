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
 * The callback function for a IntersectionController.
 */
export type IntersectionValueCallback<T = unknown> = (
  ...args: Parameters<IntersectionObserverCallback>
) => T;

/**
 * The config options for a IntersectionController.
 */
export interface IntersectionControllerConfig<T = unknown> {
  /**
   * Configuration object for the IntersectionObserver.
   */
  config?: IntersectionObserverInit;
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
  callback?: IntersectionValueCallback<T>;
  /**
   * An IntersectionObserver reports the initial intersection state
   * when observe is called. Setting this flag to true skips processing this
   * initial state for cases when this is unnecessary.
   */
  skipInitial?: boolean;
}

/**
 * IntersectionController is a ReactiveController that integrates an
 * IntersectionObserver with a ReactiveControllerHost's reactive update
 * lifecycle. This is typically a ReactiveElement or LitElement.
 * IntersectionObservers can be used to detect when a target element
 * "intersects" is visible inside of) another element or the viewport by
 * default, where intersect means "visible inside of."
 *
 * The controller can specify a `target` element to observe and the
 * configuration options to pass to the IntersectionObserver. The `observe`
 * method can be called to observe additional elements.
 *
 * When a change is detected, the controller's given `callback` function is
 * used to process the result into a value which is stored on the controller.
 * The controller's `value` is usable during the host's update cycle.
 */
export class IntersectionController<T = unknown> implements ReactiveController {
  private _host: ReactiveControllerHost;
  private _targets = new Set<Element>();
  private _observer!: IntersectionObserver;
  private _skipInitial = false;
  /**
   * Flag used to help manage calling the `callback` when observe is called
   * and `skipInitial` is set to true. Note that unlike the other observers
   * IntersectionObserver *does* report its initial state (e.g. whether or not
   * there is an intersection). This flag is used to avoid handling this
   * state if `skipInitial` is true.
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
  callback?: IntersectionValueCallback<T>;
  constructor(
    host: ReactiveControllerHost & Element,
    {target, config, callback, skipInitial}: IntersectionControllerConfig<T>
  ) {
    this._host = host;
    // Target defaults to `host` unless explicitly `null`.
    if (target !== null) {
      this._targets.add(target ?? host);
    }
    this._skipInitial = skipInitial ?? this._skipInitial;
    this.callback = callback;
    // Check browser support.
    if (!window.IntersectionObserver) {
      console.warn(
        `IntersectionController error: browser does not support IntersectionObserver.`
      );
      return;
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
    host.addController(this);
  }

  /**
   * Process the observer's changes with the controller's `callback`
   * function to produce a result stored in the `value` property.
   */
  protected handleChanges(entries: IntersectionObserverEntry[]) {
    this.value = this.callback?.(entries, this._observer);
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
    const pendingRecords = this._observer.takeRecords();
    if (pendingRecords.length) {
      this.handleChanges(pendingRecords);
    }
  }

  /**
   * Observe the target element. The controller's `target` is automatically
   * observed when the host connects.
   * @param target Element to observe
   */
  observe(target: Element) {
    this._targets.add(target);
    // Note, this will always trigger the callback since the initial
    // intersection state is reported.
    this._observer.observe(target);
    this._unobservedUpdate = true;
  }

  /**
   * Unobserve the target element.
   * @param target Element to unobserve
   */
  unobserve(target: Element) {
    this._targets.delete(target);
    this._observer.unobserve(target);
  }

  /**
   * Disconnects the observer. This is done automatically when the host
   * disconnects.
   */
  protected disconnect() {
    this._observer.disconnect();
  }
}
