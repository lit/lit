import * as React from 'react';
import {createComponent} from '@lit/react';

import {ElementMixins as ElementMixinsElement} from '@lit-internal/test-element-a/element-mixins.js';

export const ElementMixins = createComponent({
  react: React,
  tagName: 'element-mixins',
  elementClass: ElementMixinsElement,
  events: {},
});
