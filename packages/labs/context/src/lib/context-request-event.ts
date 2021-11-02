/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {ContextType, ContextKey} from './context-key.js';

declare global {
  interface HTMLElementEventMap {
    /**
     * A 'context-request' event can be emitted by any element which desires
     * a context value to be injected by an external provider.
     */
    'context-request': ContextRequestEvent<ContextKey<unknown, unknown>>;
  }
}

/**
 * A callback which is provided by a context requester and is called with the value satisfying the request.
 * This callback can be called multiple times by context providers as the requested value is changed.
 */
export type ContextCallback<ValueType> = (
  value: ValueType,
  unsubscribe?: () => void
) => void;

/**
 * Interface definition for a ContextRequest
 */
export interface ContextRequest<Context extends ContextKey<unknown, unknown>> {
  readonly context: Context;
  readonly callback: ContextCallback<ContextType<Context>>;
  readonly subscribe?: boolean;
}

/**
 * An event fired by a context requester to signal it desires a specified context.
 *
 * A provider should inspect the `context` property of the event to determine if it has a value that can
 * satisfy the request, calling the `callback` with the requested value if so.
 *
 * If the requested context event contains a truthy `subscribe` value, then a provider can call the callback
 * multiple times if the value is changed, if this is the case the provider should pass an `unsubscribe`
 * method to the callback which consumers can invoke to indicate they no longer wish to receive these updates.
 */
export class ContextRequestEvent<Context extends ContextKey<unknown, unknown>>
  extends Event
  implements ContextRequest<Context>
{
  /**
   *
   * @param context the context to request
   * @param callback the callback that should be invoked when the context is available
   * @param subscribe an optional argument, if true indicates we want to subscribe to future updates
   */
  public constructor(
    public readonly context: Context,
    public readonly callback: ContextCallback<ContextType<Context>>,
    public readonly subscribe?: boolean
  ) {
    super('context-request', {bubbles: true, composed: true});
  }
}
