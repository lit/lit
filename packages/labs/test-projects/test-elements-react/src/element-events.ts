/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import * as React from 'react';
import {createComponent, EventName} from '@lit/react';

import {ElementEvents as ElementEventsElement} from '@lit-internal/test-element-a/element-events.js';
import {MyDetail} from '@lit-internal/test-element-a/detail-type.js';
import {EventSubclass} from '@lit-internal/test-element-a/element-events.js';
import {SpecialEvent} from '@lit-internal/test-element-a/special-event.js';
export type {MyDetail, EventSubclass, SpecialEvent};

/**
 * React component that wraps <element-events>
 * See https://github.com/lit/lit/blob/main/packages/labs/test-projects/test-element-a/src/element-events.ts
 *
 * @param props.aStr a string
 * @param props.aNumber a number
 * @param props.onStringCustomEvent handler for `string-custom-event` event
 * @param props.onNumberCustomEvent handler for `number-custom-event` event
 * @param props.onMyDetailCustomEvent handler for `my-detail-custom-event` event
 * @param props.onEventSubclass handler for `event-subclass` event
 * @param props.onSpecialEvent handler for `special-event` event
 */
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
