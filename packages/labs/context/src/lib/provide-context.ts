/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {ContextRequestEvent} from './context-request-event';
import {ContextContainer} from './controllers/context-container';
import {ContextType, ContextKey} from './context-key';

/**
 * Attaches an event listener for the `context-request` event to the given
 * element and creates a context container which will deliver the current
 * context value to the consuming component.
 *
 * @param element the element on which to listen for `context-request` events
 * @param contextKey the context key to provide
 * @param value the context value to provide
 * @returns
 */
export function provideContext<Context extends ContextKey<unknown, unknown>>(
  element: HTMLElement,
  contextKey: Context,
  value?: ContextType<Context>
): ContextContainer<ContextType<Context>> {
  const container = new ContextContainer<ContextType<Context>>(value);
  element.addEventListener(
    'context-request',
    (ev: ContextRequestEvent<ContextKey<unknown, unknown>>): void => {
      if (ev.context !== contextKey) {
        return;
      }
      ev.stopPropagation();
      container.addCallback(ev.callback, ev.subscribe);
    }
  );
  return container;
}
