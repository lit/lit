/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import type {ReactiveController} from 'lit';

/**
 * ServerController extends the Reactive Controller interface to allow
 * asynchronous work to occur during SSR on the server.
 */
export interface ServerController extends ReactiveController {
  /**
   * `serverUpdateComplete` is accessed on the server during SSR. When
   * implemented, SSR rendering will pause until all the controllers on this
   * ReactiveController's host have settled.
   *
   * `serverUpdateComplete` will not be called automatically on the client.
   */
  serverUpdateComplete?: Promise<unknown>;
}
