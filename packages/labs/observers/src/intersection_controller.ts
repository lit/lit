/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
import {
  ReactiveController,
  ReactiveControllerHost,
} from '@lit/reactive-element/reactive-controller.js';
import {BaseController, type BaseControllerConfig} from './base_controller.js';
/**
 * The callback function for a IntersectionController.
 */
export type IntersectionValueCallback<T = unknown> = (
  ...args: Parameters<IntersectionObserverCallback>
) => T;

/**
 * The config options for a IntersectionController.
 */
export interface IntersectionControllerConfig<T = unknown>
  extends BaseControllerConfig {
  /**
   * Configuration object for the IntersectionObserver.
   */
  config?: IntersectionObserverInit;
  /**
   * The callback used to process detected changes into a value stored
   * in the controller's `value` property.
   */
  callback?: IntersectionValueCallback<T>;
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
export class IntersectionController<T = unknown>
  extends BaseController<IntersectionObserverInit, IntersectionValueCallback<T>>
  implements ReactiveController
{
  protected override _observer!: IntersectionObserver;
  constructor(
    host: ReactiveControllerHost & Element,
    opts: IntersectionControllerConfig<T>
  ) {
    super(host, opts);
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
      opts.config
    );
    host.addController(this);
  }

  async hostUpdated() {
    // Eagerly deliver any changes that happened during update.
    const pendingRecords = this._observer.takeRecords();
    if (pendingRecords.length) {
      this.handleChanges(pendingRecords);
    }
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
