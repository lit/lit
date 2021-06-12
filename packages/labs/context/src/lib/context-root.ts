/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {ContextKey} from './context-key.js';
import {ContextRequest, ContextRequestEvent} from './context-request-event.js';
import {ContextProviderEvent} from './controllers/context-provider.js';

type UnknownContextKey = ContextKey<unknown, unknown>;

/**
 * Makes all object properties in a type into WeakRefs
 */
type MakeWeak<T> = {[P in keyof T]: T[P] extends object ? WeakRef<T[P]> : T[P]};

/**
 * A context request, with associated source element, with all objects as weak references.
 */
type PendingContextRequest = MakeWeak<
  Omit<ContextRequest<UnknownContextKey>, 'context'>
> & {element: WeakRef<HTMLElement>};

export class ContextRoot {
  private pendingContextRequests = new Map<
    UnknownContextKey,
    Set<PendingContextRequest>
  >();

  public attach(element: HTMLElement): void {
    element.addEventListener('context-request', this.onContextRequest);
    element.addEventListener('context-provider', this.onContextProvider);
  }
  public detach(element: HTMLElement): void {
    element.removeEventListener('context-request', this.onContextRequest);
    element.removeEventListener('context-provider', this.onContextProvider);
  }

  private onContextProvider = (
    ev: ContextProviderEvent<ContextKey<unknown, unknown>>
  ) => {
    const pendingRequests = this.pendingContextRequests.get(ev.context);
    if (!pendingRequests) {
      return; // no pending requests for this provider at this time
    }

    // clear our list, any still unsatisfied requests will re-add themselves
    this.pendingContextRequests.delete(ev.context);

    // loop over all pending requests and re-dispatch them from their source
    pendingRequests.forEach((request) => {
      const element = request.element.deref();
      const callback = request.callback.deref();
      const subscribe = request.subscribe;
      // redispatch if we still have all the parts of the request
      if (element && callback) {
        element.dispatchEvent(
          new ContextRequestEvent(ev.context, callback, subscribe)
        );
      }
    });
  };

  private onContextRequest = (
    ev: ContextRequestEvent<ContextKey<unknown, unknown>>
  ) => {
    // store a weakref to this element under the context key
    const request: PendingContextRequest = {
      element: new WeakRef(ev.target as HTMLElement),
      callback: new WeakRef(ev.callback),
      subscribe: ev.subscribe,
    };
    let pendingContextRequests = this.pendingContextRequests.get(ev.context);
    if (!pendingContextRequests) {
      pendingContextRequests = new Set();
      this.pendingContextRequests.set(ev.context, pendingContextRequests);
    }
    pendingContextRequests.add(request);
  };
}
