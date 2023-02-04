/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

export class RangeChangedEvent extends Event {
  static eventName = 'rangeChanged';

  first: number;
  last: number;

  constructor(range: Range) {
    super(RangeChangedEvent.eventName, {bubbles: false});
    this.first = range.first;
    this.last = range.last;
  }
}

export class VisibilityChangedEvent extends Event {
  static eventName = 'visibilityChanged';

  first: number;
  last: number;

  constructor(range: Range) {
    super(VisibilityChangedEvent.eventName, {bubbles: false});
    this.first = range.first;
    this.last = range.last;
  }
}

export class UnpinnedEvent extends Event {
  static eventName = 'unpinned';

  constructor() {
    super(UnpinnedEvent.eventName, {bubbles: false});
  }
}

interface Range {
  first: number;
  last: number;
}
