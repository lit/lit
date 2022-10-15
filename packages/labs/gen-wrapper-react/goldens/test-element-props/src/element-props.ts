import * as React from 'react';
import {createComponent, EventName} from '@lit-labs/react';

import {ElementProps as ElementPropsElement} from '@lit-internal/test-element-props/element-props.js';

export const ElementProps = createComponent(
  React,
  'element-props',
  ElementPropsElement,
  {
    onAChanged: 'a-changed' as EventName<CustomEvent<unknown>>,
  }
);
