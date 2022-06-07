import * as React from 'react';
import {createComponent} from '@lit-labs/react';

import {ElementEvents as ElementEventsElement} from '@lit-internal/test-element-events/element-events.js';

export const ElementEvents = createComponent(
  React,
  'element-events',
  ElementEventsElement,
  {
    onStringCustomEvent: 'string-custom-event',
    onNumberCustomEvent: 'number-custom-event',
    onEventSubclass: 'event-subclass',
  }
);
