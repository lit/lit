import * as React from 'react';
import {createComponent, EventName} from '@lit-labs/react';

import {ElementA as ElementAElement} from '@lit-internal/test-element-a/element-a.js';

export const ElementA = createComponent(React, 'element-a', ElementAElement, {
  onAChanged: 'a-changed' as EventName<CustomEvent<unknown>>,
});
