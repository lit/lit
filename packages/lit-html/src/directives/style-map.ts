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

import {AttributePart, noChange, PartInfo} from '../lit-html.js';
import {
  directive,
  Directive,
  DirectiveParameters,
  PartType,
} from '../directive.js';

/**
 * A key-value set of CSS properties and values.
 *
 * The key should be either a valid CSS property name string, like
 * `'background-color'`, or a valid JavaScript camel case property name
 * for CSSStyleDeclaration like `backgroundColor`.
 */
export interface StyleInfo {
  readonly [name: string]: string;
}

class StyleMap extends Directive {
  previousStyleProperties?: Set<string>;

  constructor(partInfo: PartInfo) {
    super(partInfo);
    if (
      partInfo.type !== PartType.ATTRIBUTE ||
      partInfo.name !== 'style' ||
      (partInfo.strings !== undefined && partInfo.strings.length > 2)
    ) {
      throw new Error(
        'The `styleMap` directive must be used in the `style` attribute ' +
          'and must be the only part in the attribute.'
      );
    }
  }

  render(styleInfo: StyleInfo) {
    return Object.keys(styleInfo).reduce((style, prop) => {
      const value = styleInfo[prop];
      if (value === null) {
        return style;
      }
      // Convert property names from camel-case to dash-case, i.e.:
      //  `backgroundColor` -> `background-color`
      // Vendor-prefixed names need an extra `-` appended to front:
      //  `webkitAppearance` -> `-webkit-appearance`
      // Exception is any property name containing a dash, including
      // custom properties; we assume these are already dash-cased i.e.:
      //  `--my-button-color` --> `--my-button-color`
      prop = prop
        .replace(/(?:^(webkit|moz|ms|o)|)(?=[A-Z])/g, '-$&')
        .toLowerCase();
      return style + `${prop}:${value};`;
    }, '');
  }

  update(part: AttributePart, [styleInfo]: DirectiveParameters<this>) {
    const {style} = part.element as HTMLElement;

    if (this.previousStyleProperties === undefined) {
      this.previousStyleProperties = new Set();
      for (const name in styleInfo) {
        this.previousStyleProperties.add(name);
      }
      return this.render(styleInfo);
    }

    // Remove old properties that no longer exist in styleInfo
    // We use forEach() instead of for-of so that re don't require down-level
    // iteration.
    this.previousStyleProperties!.forEach((name) => {
      if (!(name in styleInfo)) {
        this.previousStyleProperties!.delete(name);
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
      this.previousStyleProperties.add(name);
      if (name.indexOf('-') === -1) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (style as any)[name] = styleInfo[name];
      } else {
        style.setProperty(name, styleInfo[name]);
      }
    }
    return noChange;
  }
}

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
 * @param styleInfo
 */
export const styleMap = directive(StyleMap);
