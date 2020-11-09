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
import {createCustomElementComponent} from './create-custom-element-component.js';

const isCustomElement = (tagName: unknown) =>
  typeof tagName === 'string' && customElements.get(tagName);

const componentMap: Map<string, unknown> = new Map();

/**
 * React `createElement` that supports custom elements by automatically
 * producing a react wrapper component that binds to properties and events
 * correctly. This can be used via the jsx pragma @jsx or using compiler
 * options; for example, by specifying `jsxFactory` in your `tsconfig.json`.
 *
 * @param React React module.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const createElement = (React: any) => {
  const createElement = React.createElement;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (type: any, props?: any, ...children: ReactModule.ReactNode[]) => {
    if (isCustomElement(type)) {
      const tagName = type;
      type = componentMap.get(type);
      if (type === undefined) {
        componentMap.set(
          tagName,
          (type = createCustomElementComponent(React, tagName))
        );
      }
    }
    return createElement(type, props, ...children);
  };
};
