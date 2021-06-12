/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {ContextRequestEvent} from '../context-request-event.js';
import {ContextKey, ContextType} from '../context-key.js';
import {ReactiveController, ReactiveElement} from 'lit';

export type DispatchOptions = 'connected' | 'updated' | 'raf' | 'microtask';

/**
 * ContextConsumer is a ReactiveController which binds a custom-element's
 * lifecycle to the Context API. When an element is connected to the DOM it
 * will emit the context-request event, invoking the callback set on the
 * controller when the context request is satisfied. It will also call
 * the dispose method provided by the Context API when the element is
 * disconnected.
 */
export class ContextConsumer<
  Context extends ContextKey<unknown, unknown>,
  HostElement extends ReactiveElement
> implements ReactiveController
{
  private provided = false;

  constructor(
    protected host: HostElement,
    private context: Context,
    private callback: (
      value: ContextType<Context>,
      dispose?: () => void
    ) => void,
    private dispatchOn: DispatchOptions = 'connected',
    private subscribe: boolean = false
  ) {
    this.host.addController(this);
  }

  private unsubscribe?: () => void;

  hostConnected(): void {
    this.scheduleRequest(this.dispatchOn === 'connected');
  }
  hostDisconnected(): void {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = undefined;
    }
  }
  hostUpdated(): void {
    if (!this.provided && this.dispatchOn === 'updated') {
      this.scheduleRequest(true);
    }
  }

  private scheduleRequest(immediate: boolean) {
    if (immediate) {
      this.dispatchRequest();
    } else if (this.dispatchOn === 'raf') {
      requestAnimationFrame(() => this.dispatchRequest());
    } else if (this.dispatchOn === 'microtask') {
      queueMicrotask(() => this.dispatchRequest());
    }
  }

  private dispatchRequest() {
    this.host.dispatchEvent(
      new ContextRequestEvent(
        this.context,
        (value, unsubscribe) => {
          // some providers will pass an unsubscribe function indicating they may provide future values
          if (this.unsubscribe) {
            // if the unsubscribe function changes this implies we have changed provider
            if (this.unsubscribe !== unsubscribe) {
              // cleanup the old provider
              this.provided = false;
              this.unsubscribe();
            }
            // if we don't support subscription, immediately unsubscribe
            if (!this.subscribe) {
              this.unsubscribe();
            }
          }

          // only invoke callback if we are either expecting updates or have not yet
          // been provided a value
          if (!this.provided || this.subscribe) {
            this.provided = true;
            this.callback(value, unsubscribe);
          }

          this.unsubscribe = unsubscribe;
        },
        this.subscribe
      )
    );
  }
}
