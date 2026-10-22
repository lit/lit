import * as React from 'react';
import {createComponent} from '@lit/react';

import {ElementEnum as ElementEnumElement} from '@lit-internal/test-element-a/element-enum.js';

export const ElementEnum = createComponent({
  react: React,
  tagName: 'element-enum',
  elementClass: ElementEnumElement,
  events: {},
});
