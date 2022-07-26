import * as React from 'react';
import {createComponent} from '@lit-labs/react';

import {ElementSlots as ElementSlotsElement} from '@lit-internal/test-element-slots/element-slots.js';

export const ElementSlots = createComponent(
  React,
  'element-slots',
  ElementSlotsElement,
  {}
);
