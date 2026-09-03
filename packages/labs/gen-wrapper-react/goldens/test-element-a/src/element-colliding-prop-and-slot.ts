import * as React from 'react';
import {createComponent} from '@lit/react';

import {ElementCollidingPropAndSlot as ElementCollidingPropAndSlotElement} from '@lit-internal/test-element-a/element-colliding-prop-and-slot.js';

export const ElementCollidingPropAndSlot = createComponent({
  react: React,
  tagName: 'element-colliding-prop-and-slot',
  elementClass: ElementCollidingPropAndSlotElement,
  events: {},
});
