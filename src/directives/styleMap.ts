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

import {AttributePart, directive, Directive, PropertyPart} from '../lit-html.js';

export interface StyleInfo {
  [name: string]: string;
}

/**
 * Stores the StyleInfo object applied to a given AttributePart.
 * Used to unset existing values when a new StyleInfo object is applied.
 */
const styleMapCache = new WeakMap();

/**
 * Stores AttributeParts that have had static styles applied (e.g. `height: 0;`
 * in style="height: 0; ${styleMap()}"). Static styles are applied only the
 * first time the directive is run on a part.
 */
// Note, could be a WeakSet, but prefer not requiring this polyfill.
const styleMapStatics = new WeakMap();

/**
 * A directive that applies CSS properties. This must be used in the `style`
 * attribute and must be the only part used in the attribute. It takes the
 * property names in the `styleInfo` object and adds the property values as a
 * css style propertes. For example `{backgroundColor: 'red', borderTop: '5px'}`
 * sets these properties to the element's style.
 * @param styleInfo {StyleInfo}
 */
export const styleMap = (styleInfo: StyleInfo): Directive<AttributePart> =>
    directive((part: AttributePart) => {
      if (!(part instanceof AttributePart) || (part instanceof PropertyPart) ||
          part.committer.name !== 'style' || part.committer.parts.length > 1) {
        throw new Error(
            'The `styleMap` directive must be used in the style attribute ' +
            'and must be the only part in the attribute.');
      }
      // handle static styles
      if (!styleMapStatics.has(part)) {
        (part.committer.element as HTMLElement).style.cssText =
            part.committer.strings.join(' ');
        styleMapStatics.set(part, true);
      }
      // remove old styles that no longer apply
      const oldInfo = styleMapCache.get(part);
      for (const name in oldInfo) {
        if (!(name in styleInfo)) {
          ((part.committer.element as HTMLElement).style as any)[name] = null;
        }
      }
      Object.assign((part.committer.element as HTMLElement).style, styleInfo);
      styleMapCache.set(part, styleInfo);
    });