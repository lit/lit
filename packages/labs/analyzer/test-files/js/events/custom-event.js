/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

export class ExternalCustomEvent extends Event {
  constructor(message) {
    super('external-custom-event');
    this.message = message;
  }
}

export class ExternalClass {
  constructor() {
    this.someData = 42;
  }
}
