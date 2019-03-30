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

import {AttributePart, directive, Part, PropertyPart} from '../lit-html.js';

export interface StyleInfo {
  readonly [name: string]: string;
}

/**
 * Stores the StyleInfo object applied to a given AttributePart.
 * Used to unset existing values when a new StyleInfo object is applied.
 */
const styleMapCache = new WeakMap<AttributePart, StyleInfo>();

/**
 * A directive that applies CSS properties to an element.
 *
 * `styleMap` can only be used in the `style` attribute and must be the only
 * expression in the attribute. It takes the property names in the `styleInfo`
 * object and adds the property values as CSS propertes. Property names with
 * dashes (`-`) are assumed to be valid CSS property names and set on the
 * element's style object using `setProperty()`. Names without dashes are
 * assumed to be camelCased JavaScript property names and set on the element's
 * style object using property assignment, allowing the style object to
 * translate JavaScript-style names to CSS property names.
 *
 * For example `styleMap({backgroundColor: 'red', 'border-top': '5px', '--size':
 * '0'})` sets the `background-color`, `border-top` and `--size` properties.
 *
 * @param styleInfo {StyleInfo}
 */
export const styleMap = directive((styleInfo: StyleInfo) => (part: Part) => {
  if (!(part instanceof AttributePart) || (part instanceof PropertyPart) ||
      part.committer.name !== 'style' || part.committer.parts.length > 1) {
    throw new Error(
        'The `styleMap` directive must be used in the style attribute ' +
        'and must be the only part in the attribute.');
  }

  const {committer} = part;
  const {style} = committer.element as HTMLElement;

  // Handle static styles the first time we see a Part
  if (!styleMapCache.has(part)) {
    style.cssText = committer.strings.join(' ');
  }

  // Remove old properties that no longer exist in styleInfo
  const oldInfo = styleMapCache.get(part);
  for (const name in oldInfo) {
    if (!(name in styleInfo)) {
      if (name.indexOf('-') === -1) {
        // tslint:disable-next-line:no-any
        (style as any)[name] = null;
      } else {
        style.removeProperty(name);
      }
    }
  }

  // Add or update properties
  for (const name in styleInfo) {
    if (name.indexOf('-') === -1) {
      // tslint:disable-next-line:no-any
      (style as any)[name] = styleInfo[name];
    } else {
      style.setProperty(name, styleInfo[name]);
    }
  }
  styleMapCache.set(part, styleInfo);
});
