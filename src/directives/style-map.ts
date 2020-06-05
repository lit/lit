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

// This shim is used on first render, to generate a string to commit
// rather than manipulate the style object, to be compatible with SSR.
class StyleDeclaration {
  setProperty(name: string, value: string) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (this as any)[name] = value;
  }
  removeProperty(name: string) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (this as any)[name] = null;
  }
  getValue() {
    return (Object.getOwnPropertyNames(this).reduce((value, prop) => {
             // eslint-disable-next-line @typescript-eslint/no-explicit-any
             const v = (this as any)[prop];
             if (v === null) {
               return value;
             }
             if (prop.indexOf('-') === -1) {
               prop = prop.replace(/([A-Z])/g, '-$1').toLowerCase();
               return value + `${prop}: ${v}; `;
             }
             return value + `${prop}:${v}; `;
           }, '')).trim();
  }
}

/**
 * Stores the StyleInfo object applied to a given AttributePart.
 * Used to unset existing values when a new StyleInfo object is applied.
 */
const previousStylePropertyCache = new WeakMap<AttributePart, Set<string>>();

/**
 * A directive that applies CSS properties to an element.
 *
 * `styleMap` can only be used in the `style` attribute and must be the only
 * expression in the attribute. It takes the property names in the `styleInfo`
 * object and adds the property values as CSS properties. Property names with
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

  let previousStyleProperties = previousStylePropertyCache.get(part);

  let style: CSSStyleDeclaration|StyleDeclaration;
  if (previousStyleProperties === undefined) {
    // First render of this directive into this part, so use StyleDeclaration
    // shim to generate a string for first-render, to be compatible with SSR
    style = new StyleDeclaration();
    previousStylePropertyCache.set(part, previousStyleProperties = new Set());
  } else {
    style = (committer.element as HTMLElement).style;
  }

  // Remove old properties that no longer exist in styleInfo
  // We use forEach() instead of for-of so that re don't require down-level
  // iteration.
  previousStyleProperties.forEach((name) => {
    if (!(name in styleInfo)) {
      previousStyleProperties!.delete(name);
      if (name.indexOf('-') === -1) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (style as any)[name] = null;
      } else {
        style.removeProperty(name);
      }
    }
  });

  // Add or update properties
  for (const name in styleInfo) {
    previousStyleProperties.add(name);
    if (name.indexOf('-') === -1) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (style as any)[name] = styleInfo[name];
    } else {
      style.setProperty(name, styleInfo[name]);
    }
  }

  // Commit the string if this was initial render
  if (style instanceof StyleDeclaration) {
    part.setValue(style.getValue());
  }
});
