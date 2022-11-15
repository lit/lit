/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {ContextRequestEvent} from '../context-request-event.js';
import {Context, ContextType} from '../create-context.js';
import {ValueNotifier} from '../value-notifier.js';
import {ReactiveController, ReactiveElement} from 'lit';

declare global {
  interface HTMLElementEventMap {
    /**
     * A 'context-provider' event can be emitted by any element which hosts
     * a context provider to indicate it is available for use.
     */
    'context-provider': ContextProviderEvent<Context<unknown, unknown>>;
  }
}

export class ContextProviderEvent<
  C extends Context<unknown, unknown>
> extends Event {
  /**
   *
   * @param context the context which this provider can provide
   */
  public constructor(public readonly context: C) {
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
export class ContextProvider<T extends Context<unknown, unknown>>
  extends ValueNotifier<ContextType<T>>
  implements ReactiveController
{
  constructor(
    protected host: ReactiveElement,
    private context: T,
    initialValue?: ContextType<T>
  ) {
    super(initialValue);
    this.attachListeners();
    this.host.addController(this);
  }

  public onContextRequest = (
    ev: ContextRequestEvent<Context<unknown, unknown>>
  ): void => {
    // Only call the callback if the context matches.
    // Also, in case an element is a consumer AND a provider
    // of the same context, we want to avoid the element to self-register.
    // The check on composedPath (as opposed to ev.target) is to cover cases
    // where the consumer is in the shadowDom of the provider (in which case,
    // event.target === this.host because of event retargeting).
    if (ev.context !== this.context || ev.composedPath()[0] === this.host) {
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
