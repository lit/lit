/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import type {ReactiveElement} from 'lit';
import {effect} from '@preact/signals-core';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ReactiveElementConstructor = new (...args: any[]) => ReactiveElement;

/**
 * Adds the ability for a LitElement or other ReactiveElement class to
 * watch for access to Preact signals during the update lifecycle and
 * trigger a new update when signals values change.
 */
export function SignalWatcher<T extends ReactiveElementConstructor>(
  Base: T
): T {
  return class SignalWatcher extends Base {
    private _disposeEffect?: () => void;

    override performUpdate() {
      // ReactiveElement.performUpdate() also does this check, so we want to
      // also bail early so we don't erroneously appear to not depend on any
      // signals.
      if (!this.isUpdatePending) {
        return;
      }
      // If we have a previous effect, dispose it
      this._disposeEffect?.();

      // Tracks whether the effect callback is triggered by this performUpdate
      // call directly, or by a signal change.
      let updateFromLit = true;

      // We create a new effect to capture all signal access within the
      // performUpdate phase (update, render, updated, etc) of the element.
      // Q: Do we need to create a new effect each render?
      // TODO: test various combinations of render triggers:
      //  - from requestUpdate()
      //  - from signals
      //  - from both (do we get one or two re-renders)
      // and see if we really need a new effect here.
      this._disposeEffect = effect(() => {
        if (updateFromLit) {
          updateFromLit = false;
          super.performUpdate();
        } else {
          // This branch is an effect run from Preact signals.
          // This will cause another call into performUpdate, which will
          // then create a new effect watching that update pass.
          this.requestUpdate();
        }
      });
    }

    // TODO(justinfagnani): should we wrap any lifecycle methods (willUpdate,
    // updated, etc) in a signal batch?
  };
}
