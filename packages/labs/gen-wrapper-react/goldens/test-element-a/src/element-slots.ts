import * as React from 'react';
import {createComponent, EventName} from '@lit/react';

import {ElementSlots as ElementSlotsElement} from '@lit-internal/test-element-a/element-slots.js';
import {
  CellSlotsChangeEvent,
  CellIconSlotsChangeEvent,
} from '@lit-internal/test-element-a/element-slots.js';
export type {
  CellSlotsChangeEvent,
  CellIconSlotsChangeEvent,
} from '@lit-internal/test-element-a/element-slots.js';

export const ElementSlots = createComponent({
  react: React,
  tagName: 'element-slots',
  elementClass: ElementSlotsElement,
  events: {
    onCellSlotsChange: 'cell-slots-change' as EventName<CellSlotsChangeEvent>,
    onCellIconSlotsChange:
      'cell-icon-slots-change' as EventName<CellIconSlotsChangeEvent>,
    onTabIconSlotsChange: 'tab-icon-slots-change' as EventName<
      CustomEvent<unknown>
    >,
  },
});
