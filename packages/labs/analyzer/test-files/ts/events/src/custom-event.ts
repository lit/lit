/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

export class ExternalCustomEvent extends Event {
  message: string;
  constructor(message) {
    super('external-custom-event');
    this.message = message;
  }
}

declare global {
  interface EventNameMap {
    'external-custom-event': ExternalCustomEvent;
  }
}

export class ExternalClass {
  someData: number;
}
