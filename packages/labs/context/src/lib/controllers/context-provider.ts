/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {ContextRequestEvent} from '../context-request-event.js';
import {ContextKey, ContextType} from '../context-key.js';
import {ValueNotifier} from '../value-notifier.js';
import {ReactiveController, ReactiveElement} from 'lit';

declare global {
  interface HTMLElementEventMap {
    /**
     * A 'context-provider' event can be emitted by any element which hosts
     * a context provider to indicate it is available for use.
     */
    'context-provider': ContextProviderEvent<ContextKey<unknown, unknown>>;
  }
}

export class ContextProviderEvent<
  Context extends ContextKey<unknown, unknown>
> extends Event {
  /**
   *
   * @param context the context which this provider can provide
   */
  public constructor(public readonly context: Context) {
    super('context-provider', {bubbles: true, composed: true});
  }
}

/**
 * A ReactiveController which can add context provider behavior to a
 * custom-element.
 *
 * This controller simply listens to the `context-request` event when
 * the host is connected to the DOM and registers the received callbacks
 * against its observable Context implementation.
 */
export class ContextProvider<T extends ContextKey<unknown, unknown>>
  extends ValueNotifier<ContextType<T>>
  implements ReactiveController
{
  constructor(
    protected host: ReactiveElement,
    private context: T,
    initialValue?: ContextType<T>
  ) {
    super(initialValue);
    this.host.addController(this);
    this.attachListeners();
  }

  public onContextRequest = (
    ev: ContextRequestEvent<ContextKey<unknown, unknown>>
  ): void => {
    if (ev.context !== this.context) {
      return;
    }
    ev.stopPropagation();
    this.addCallback(ev.callback, ev.subscribe);
  };

  private attachListeners() {
    this.host.addEventListener('context-request', this.onContextRequest);
  }

  hostConnected(): void {
    // emit an event to signal a provider is available for this context
    this.host.dispatchEvent(new ContextProviderEvent(this.context));
  }
}
