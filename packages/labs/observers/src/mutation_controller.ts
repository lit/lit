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
 * The callback function for a MutationController.
 */
export type MutationValueCallback<T = unknown> = (
  ...args: Parameters<MutationCallback>
) => T;

/**
 * The config options for a MutationController.
 */
export interface MutationControllerConfig<T = unknown>
  extends ObserverControllerConfig {
  /**
   * Configuration object for the MutationObserver.
   */
  config: MutationObserverInit;
  /**
   * The callback used to process detected changes into a value stored
   * in the controller's `value` property.
   */
  callback?: MutationValueCallback<T>;
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
export class MutationController<T = unknown>
  extends ObserverController<MutationObserverInit, MutationValueCallback<T>>
  implements ReactiveController
{
  protected override _observer!: MutationObserver;
  constructor(
    host: ReactiveControllerHost & Element,
    opts: MutationControllerConfig<T>
  ) {
    super(host, opts);
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

  protected observeElement(target: Element) {
    this._observer.observe(target, this._config);
  }
}
