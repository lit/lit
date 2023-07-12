/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {ContextRequestEvent} from '../context-request-event.js';
import {Context, ContextType} from '../create-context.js';
import {MovedSubscription, ValueNotifier} from '../value-notifier.js';
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

  /**
   * Whether the element that dispatched this event can take over subscriptions
   * from an ancestor provider.
   */
  declare canTakeOverSubscriptions: boolean;

  /**
   * Ongoing subscriptions that one of our ancestors was handling that are now
   * our responsibility.
   */
  movedSubscriptions: undefined | MovedSubscription<ContextType<C>>[] =
    undefined;
}
// True for all ContextProviderEvents that we fire, but we need to set this
// so that ancestor providers can tell whether the provider that dispatched this
// event will actually take over any subscriptions that they move to
// `event.movedSubscriptions`.
// This way we fail gracefully in the case where there's version drift, or
// another implementor that of the context protocol that also dispatches
// `context-provider` events but doesn't handle movedSubscriptions.
ContextProviderEvent.prototype.canTakeOverSubscriptions = true;

export interface Options<C extends Context<unknown, unknown>> {
  context: C;
  initialValue?: ContextType<C>;
}

/**
 * A ReactiveController which adds context provider behavior to a
 * custom element.
 *
 * This controller simply listens to the `context-request` event when
 * the host is connected to the DOM and registers the received callbacks
 * against its observable Context implementation.
 */
export class ContextProvider<T extends Context<unknown, unknown>>
  extends ValueNotifier<ContextType<T>>
  implements ReactiveController
{
  protected host: ReactiveElement;
  private context: T;

  constructor(host: ReactiveElement, options: Options<T>);
  /** @deprecated Use new ContextProvider(host, options) */
  constructor(host: ReactiveElement, context: T, initialValue?: ContextType<T>);
  constructor(
    host: ReactiveElement,
    contextOrOptions: T | Options<T>,
    initialValue?: ContextType<T>
  ) {
    super(
      (contextOrOptions as Options<T>).context !== undefined
        ? (contextOrOptions as Options<T>).initialValue
        : initialValue
    );
    this.host = host;
    if ((contextOrOptions as Options<T>).context !== undefined) {
      this.context = (contextOrOptions as Options<T>).context;
    } else {
      this.context = contextOrOptions as T;
    }
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
    const consumerHost = ev.composedPath()[0] as Element;
    if (ev.context !== this.context || consumerHost === this.host) {
      return;
    }
    ev.stopPropagation();
    this.addCallback(ev.callback, ev.subscribe, consumerHost);
  };

  public onProviderRequest = (
    ev: ContextProviderEvent<Context<unknown, unknown>>
  ): void => {
    // Ignore events when the context doesn't match.
    // Also, in case an element is a consumer AND a provider
    // of the same context, we want to avoid the element to self-register.
    // The check on composedPath (as opposed to ev.target) is to cover cases
    // where the consumer is in the shadowDom of the provider (in which case,
    // event.target === this.host because of event retargeting).
    const childProviderHost = ev.composedPath()[0] as Element;
    if (
      !ev.canTakeOverSubscriptions ||
      ev.context !== this.context ||
      childProviderHost === this.host
    ) {
      return;
    }
    const ourEv = ev as ContextProviderEvent<T>;
    const movedSubscriptions = this.moveSubscriptionsFor(childProviderHost);
    if (movedSubscriptions === undefined) {
      return;
    }
    (ourEv.movedSubscriptions ??= []).push(...movedSubscriptions);
  };

  private attachListeners() {
    this.host.addEventListener('context-request', this.onContextRequest);
    this.host.addEventListener('context-provider', this.onProviderRequest);
  }

  hostConnected(): void {
    // emit an event to signal a provider is available for this context
    const providerEvent = new ContextProviderEvent(this.context);
    this.host.dispatchEvent(providerEvent);
    if (providerEvent.movedSubscriptions !== undefined) {
      for (const {callback, consumerHost} of providerEvent.movedSubscriptions) {
        this.addCallback(callback, true, consumerHost);
      }
    }
  }
}
