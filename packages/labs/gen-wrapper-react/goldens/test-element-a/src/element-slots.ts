import * as React from 'react';
import {createComponent} from '@lit/react';

import {ElementSlots as ElementSlotsElement} from '@lit-internal/test-element-a/element-slots.js';

export const ElementSlots = createComponent({
  react: React,
  tagName: 'element-slots',
  elementClass: ElementSlotsElement,
  events: {},
});
