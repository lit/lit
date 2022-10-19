import * as React from 'react';
import {createComponent, EventName} from '@lit-labs/react';

import {ElementEvents as ElementEventsElement} from '@lit-internal/test-element-events/element-events.js';
import {MyDetail} from '@lit-internal/test-element-events/detail-type.js';
import {EventSubclass} from '@lit-internal/test-element-events/element-events.js';
import {SpecialEvent} from '@lit-internal/test-element-events/special-event.js';

export const ElementEvents = createComponent(
  React,
  'element-events',
  ElementEventsElement,
  {
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
  }
);
