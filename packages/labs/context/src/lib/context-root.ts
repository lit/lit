/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {Context} from './create-context.js';
import {ContextCallback, ContextRequestEvent} from './context-request-event.js';
import {ContextProviderEvent} from './controllers/context-provider.js';

/**
 * A ContextRoot buffers unsatisfied context request events. It will redispatch
 * these requests when new providers which satisfy matching contexts
 * are available.
 */
export class ContextRoot {
  private pendingContextRequests = new Map<
    Context<unknown, unknown>,
    // Both the element and callback must be stored in WeakRefs because the
    // callback most likely has a strong ref to the element.
    Array<{
      elementRef: WeakRef<HTMLElement>;
      callbackRef: WeakRef<ContextCallback<unknown>>;
    }>
  >();

  /**
   * Attach the ContextRoot to a given element to intercept `context-request` and
   * `context-provider` events.
   *
   * @param element an element to add event listeners to
   */
  public attach(element: HTMLElement): void {
    element.addEventListener('context-request', this.onContextRequest);
    element.addEventListener('context-provider', this.onContextProvider);
  }

  /**
   * Removes the ContextRoot event listeners from a given element.
   *
   * @param element an element from which to remove event listeners
   */
  public detach(element: HTMLElement): void {
    element.removeEventListener('context-request', this.onContextRequest);
    element.removeEventListener('context-provider', this.onContextProvider);
  }

  private onContextProvider = (
    event: ContextProviderEvent<Context<unknown, unknown>>
  ) => {
    const pendingRequests = this.pendingContextRequests.get(event.context);
    if (pendingRequests === undefined) {
      // No pending requests for this context at this time
      return;
    }

    // TODO (justinfagnani): is this true? How do consumers re-add themselves?
    // Clear our list, any still unsatisfied requests will re-add themselves
    // this.pendingContextRequests.delete(event.context);

    // Loop over all pending requests and re-dispatch them from their source
    for (let i = 0; i < pendingRequests.length; i++) {
      const {elementRef, callbackRef} = pendingRequests[i];
      const element = elementRef.deref();
      const callback = callbackRef.deref();
      if (element === undefined || callback === undefined) {
        // Remove the element and callback refs if the consumer has been GC'ed
        pendingRequests.splice(i, 1);
        i--;
      } else {
        // Re-dispatch if we still have all the parts of the request
        element.dispatchEvent(
          new ContextRequestEvent(event.context, callback, true)
        );
      }
    }
  };

  private onContextRequest = (
    event: ContextRequestEvent<Context<unknown, unknown>>
  ) => {
    // Events that are not subscribing should not be buffered
    if (event.subscribe !== true) {
      return;
    }

    let pendingContextRequests = this.pendingContextRequests.get(event.context);
    if (pendingContextRequests === undefined) {
      this.pendingContextRequests.set(
        event.context,
        (pendingContextRequests = [])
      );
    }

    pendingContextRequests.push({
      elementRef: new WeakRef(event.target as HTMLElement),
      callbackRef: new WeakRef(event.callback),
    });
  };
}
