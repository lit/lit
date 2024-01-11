/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {Console} from 'console';

export type Level = 'error' | 'warn' | 'info' | 'verbose' | 'debug';

/**
 * A Console with a settable log level that controls whether messages are
 * actually output or not.
 */
export class LitConsole extends Console {
  logLevel: Level = 'debug';

  override info(message?: unknown, ...optionalParams: unknown[]): void {
    if (
      this.logLevel === 'info' ||
      this.logLevel === 'verbose' ||
      this.logLevel === 'debug'
    ) {
      super.info(message, ...optionalParams);
    }
  }

  override warn(message?: unknown, ...optionalParams: unknown[]): void {
    if (
      this.logLevel === 'warn' ||
      this.logLevel === 'info' ||
      this.logLevel === 'verbose' ||
      this.logLevel === 'debug'
    ) {
      super.warn(message, ...optionalParams);
    }
  }

  override debug(message?: unknown, ...optionalParams: unknown[]): void {
    if (this.logLevel === 'debug') {
      super.debug(message, ...optionalParams);
    }
  }
}
