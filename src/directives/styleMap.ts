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

import {AttributePart, Part, PropertyPart} from '../lit-html.js';
import {createDirective} from '../lib/createDirective.js';

export interface StyleInfo {
  [name: string]: string;
}

/**
 * A directive that applies CSS properties. This must be used in the `style`
 * attribute and must be the only part used in the attribute. It takes the
 * property names in the `styleInfo` object and adds the property values as a
 * css style propertes. For example `{backgroundColor: 'red', borderTop: '5px'}`
 * sets these properties to the element's style.
 * @param styleInfo {StyleInfo}
 */
export const styleMap = createDirective((part: Part) => {
  if (!(part instanceof AttributePart) || (part instanceof PropertyPart) ||
      part.committer.name !== 'style' || part.committer.parts.length > 1) {
    throw new Error(
        'The `styleMap` directive must be used in the style attribute ' +
        'and must be the only part in the attribute.');
  }

  // handle static styles
  (part.committer.element as HTMLElement).style.cssText = part.committer.strings.join(' ');
  let oldInfo: StyleInfo | undefined;

  return (styleInfo: StyleInfo) => {
    // remove old styles that no longer apply
    if(oldInfo) {
      for (const name in oldInfo) {
        if (!(name in styleInfo)) {
          ((part.committer.element as HTMLElement).style as any)[name] = null;
        }
      }
    }
    Object.assign((part.committer.element as HTMLElement).style, styleInfo);
    oldInfo = styleInfo;
  };
});
