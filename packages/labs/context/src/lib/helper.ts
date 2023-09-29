/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {ContextRequestEvent} from './context-request-event.js';
import {Context} from './create-context.js';

/**
 * A helper method for use in situations where a web component is isolated
 * from the parent that provides the context.
 *
 * This helper provides static values for the specified contexts. It does
 * not support updates via subscribe.
 */
export const provideHelper = (params: {[key: string]: unknown}) => {
  return (event: ContextRequestEvent<Context<unknown, unknown>>) => {
    const value = params[event.context as unknown as string];

    if (value) {
      event.callback(value);
    }
  };
};
