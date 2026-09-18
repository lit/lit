import * as React from 'react';
import {createComponent, EventName} from '@lit/react';

import {ElementNativeEvents as ElementNativeEventsElement} from '@lit-internal/test-element-a/element-native-events.js';
import {NativeDetail} from '@lit-internal/test-element-a/element-native-events.js';
export type {NativeDetail} from '@lit-internal/test-element-a/element-native-events.js';

export const ElementNativeEvents = createComponent({
  react: React,
  tagName: 'element-native-events',
  elementClass: ElementNativeEventsElement,
  events: {
    onInput: 'input' as EventName<CustomEvent<NativeDetail>>,
    onValueChanged: 'value-changed' as EventName<CustomEvent<NativeDetail>>,
  },
});
