import * as React from 'react';
import {createComponent, EventName} from '@lit/react';

import {ElementSub as ElementSubElement} from '@lit-internal/test-element-a/sub/element-sub.js';

export const ElementSub = createComponent({
  react: React,
  tagName: 'element-sub',
  elementClass: ElementSubElement,
  events: {
    onSubChanged: 'sub-changed' as EventName<CustomEvent<unknown>>,
  },
});
