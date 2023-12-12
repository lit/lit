import * as React from 'react';
import {createComponent} from '@lit/react';

import {ElementWithoutProps as ElementWithoutPropsElement} from '@lit-internal/test-element-a/element-without-props.js';

export const ElementWithoutProps = createComponent({
  react: React,
  tagName: 'element-without-props',
  elementClass: ElementWithoutPropsElement,
  events: {},
});
