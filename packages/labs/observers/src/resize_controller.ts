/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
import {
  ReactiveController,
  ReactiveControllerHost,
} from '@lit/reactive-element/reactive-controller.js';

import {
  ObserverController,
  type ObserverControllerConfig,
} from './observer_controller.js';
/**
 * The callback function for a ResizeController.
 */
export type ResizeValueCallback<T = unknown> = (
  ...args: Parameters<ResizeObserverCallback>
) => T;

/**
 * The config options for a ResizeController.
 */
export interface ResizeControllerConfig<T = unknown>
  extends ObserverControllerConfig {
  /**
   * Configuration object for the ResizeController.
   */
  config?: ResizeObserverOptions;
  /**
   * The callback used to process detected changes into a value stored
   * in the controller's `value` property.
   */
  callback?: ResizeValueCallback<T>;
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
export class ResizeController<T = unknown>
  extends ObserverController<ResizeObserverOptions, ResizeValueCallback<T>>
  implements ReactiveController
{
  protected override _observer!: ResizeObserver;
  constructor(
    host: ReactiveControllerHost & Element,
    opts: ResizeControllerConfig<T>
  ) {
    super(host, opts);

    // Check browser support.
    if (!window.ResizeObserver) {
      console.warn(
        `ResizeController error: browser does not support ResizeObserver.`
      );
      return;
    }
    this._observer = new ResizeObserver((entries: ResizeObserverEntry[]) => {
      this.handleChanges(entries);
      this._host.requestUpdate();
    });
    host.addController(this);
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

  protected observeElement(target: Element) {
    this._observer.observe(target, this._config);
  }

  /**
   * Unobserve the target element.
   * @param target Element to unobserve
   */
  unobserve(target: Element) {
    this._targets.delete(target);
    this._observer.unobserve(target);
  }
}
