/**
 * @license
 * Copyright (c) 2018 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at
 * http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at
 * http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */

import * as ReactModule from 'react';
import {createComponent} from './create-component.js';

const isCustomElement = (tagName: unknown) =>
  typeof tagName === 'string' && customElements.get(tagName);

/**
 * React `createElement` that supports custom elements by automatically
 * producing a react wrapper component that binds to properties and events
 * correctly. This can be used via the jsx pragma @jsx or using compiler
 * options; for example, by specifying `jsxFactory` in your `tsconfig.json`.
 *
 * @param React React module.
 */
export const createElement = (React: typeof ReactModule) => {
  const createElement = React.createElement;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (type: any, props?: any, ...children: ReactModule.ReactNode[]) => {
    if (isCustomElement(type)) {
      type = createComponent(React, type);
    }
    return createElement(type, props, ...children);
  };
};
