/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import * as React from 'react';
import {createComponent, EventName} from '@lit-labs/react';

import {ElementEvents as ElementEventsElement} from '@lit-internal/test-element-a/element-events.js';
import {MyDetail} from '@lit-internal/test-element-a/detail-type.js';
import {EventSubclass} from '@lit-internal/test-element-a/element-events.js';
import {SpecialEvent} from '@lit-internal/test-element-a/special-event.js';
export type {MyDetail} from '@lit-internal/test-element-a/detail-type.js';
export type {EventSubclass} from '@lit-internal/test-element-a/element-events.js';
export type {SpecialEvent} from '@lit-internal/test-element-a/special-event.js';

export const ElementEvents = createComponent({
  react: React,
  tagName: 'element-events',
  elementClass: ElementEventsElement,
  events: {
    onStringCustomEvent: 'string-custom-event' as EventName<
      CustomEvent<string>
    >,
    onNumberCustomEvent: 'number-custom-event' as EventName<
      CustomEvent<number>
    >,
    onMyDetailCustomEvent: 'my-detail-custom-event' as EventName<
      CustomEvent<MyDetail>
    >,
    onEventSubclass: 'event-subclass' as EventName<EventSubclass>,
    onSpecialEvent: 'special-event' as EventName<SpecialEvent>,
  },
});
