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

// TODO: Write a UMD->module shim or take React as an argument to
// createReactComponent so we don't have to worry about how to load React.
import * as ReactModule from 'react';
import {createComponent} from './createComponent.js';

const isCustomElement = (tagName: any) =>
  typeof tagName === 'string' && customElements.get(tagName);

const componentMap: Map<string, any> = new Map();

/**
 *
 * @param React React module.
 */
export const createElement = (React: any) => {
  const createElement = React.createElement;
  return (type: any, props?: any, ...children: ReactModule.ReactNode[]) => {
    if (isCustomElement(type)) {
      const tagName = type;
      type = componentMap.get(type);
      if (type === undefined) {
        componentMap.set(tagName, (type = createComponent(React, tagName)));
      }
    }
    return createElement(type, props, ...children);
  };
};
