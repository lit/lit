import * as React from 'react';
import {createComponent} from '@lit-labs/react';

import {ElementA as ElementAElement} from 'test-element-a/element-a.js';

export const ElementA = createComponent(React, 'element-a', ElementAElement, {
  onAChanged: 'a-changed',
});
