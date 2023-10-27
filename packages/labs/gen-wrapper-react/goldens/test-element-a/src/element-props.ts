import * as React from 'react';
import {createComponent, EventName} from '@lit/react';

import {ElementProps as ElementPropsElement} from '@lit-internal/test-element-a/element-props.js';

export const ElementProps = createComponent({
  react: React,
  tagName: 'element-props',
  elementClass: ElementPropsElement,
  events: {
    onAChanged: 'a-changed' as EventName<CustomEvent<unknown>>,
  },
});
