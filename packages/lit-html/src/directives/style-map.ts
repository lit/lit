/**
 * @license
 * Copyright The Lit Project Contributors.
 * Copyright 2018 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {AttributePart, noChange} from '../lit-html.js';
import {
  directive,
  Directive,
  DirectiveParameters,
  PartInfo,
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
  [name: string]: string | number | undefined | null;
}

const important = 'important';
// The leading space is important
const importantFlag = ' !' + important;
// How many characters to remove from a value, as a negative number
const flagTrim = 0 - importantFlag.length;

/**
 * The "IDL attribute to CSS property" algorithm from CSSOM, used by
 * `CSSStyleProperties` to map its camel-cased and webkit-cased attributes to
 * CSS property names.
 * https://drafts.csswg.org/cssom/#idl-attribute-to-css-property
 */
const idlAttributeToCssProperty = (attribute: string, dashPrefix: boolean) =>
  (dashPrefix ? '-' : '') +
  attribute.replace(/[A-Z]/g, (c) => '-' + c.toLowerCase());

/**
 * Returns the CSS property name for a `styleMap` key, the same way
 * `CSSStyleProperties` maps its attributes to the property names it passes to
 * `setProperty()`. https://drafts.csswg.org/cssom/#cssstyleproperties
 *
 * - dashed attribute (any name containing a dash, including custom
 *   properties): used as-is, e.g. `font-size`, `--my-color`
 * - `cssFloat`: `float`
 * - webkit-cased attribute: dash-prefixed, e.g. `webkitTransform` ->
 *   `-webkit-transform`
 * - camel-cased attribute: e.g. `fontSize` -> `font-size`,
 *   `WebkitTransform` -> `-webkit-transform`
 */
const cssPropertyName = (name: string) =>
  name.includes('-')
    ? name
    : name === 'cssFloat'
      ? 'float'
      : idlAttributeToCssProperty(name, /^webkit[A-Z]/.test(name));

class StyleMapDirective extends Directive {
  private _previousStyleProperties?: Set<string>;

  constructor(partInfo: PartInfo) {
    super(partInfo);
    if (
      partInfo.type !== PartType.ATTRIBUTE ||
      partInfo.name !== 'style' ||
      (partInfo.strings?.length as number) > 2
    ) {
      throw new Error(
        'The `styleMap` directive must be used in the `style` attribute ' +
          'and must be the only part in the attribute.'
      );
    }
  }

  render(styleInfo: Readonly<StyleInfo>) {
    return Object.keys(styleInfo).reduce((style, prop) => {
      const value = styleInfo[prop];
      if (value == null) {
        return style;
      }
      return style + `${cssPropertyName(prop)}:${value};`;
    }, '');
  }

  override update(part: AttributePart, [styleInfo]: DirectiveParameters<this>) {
    const {style} = part.element as HTMLElement;

    if (this._previousStyleProperties === undefined) {
      this._previousStyleProperties = new Set(Object.keys(styleInfo));
      return this.render(styleInfo);
    }

    // Remove old properties that no longer exist in styleInfo
    for (const name of this._previousStyleProperties) {
      // If the name isn't in styleInfo or it's null/undefined
      if (styleInfo[name] == null) {
        this._previousStyleProperties!.delete(name);
        style.removeProperty(cssPropertyName(name));
      }
    }

    // Add or update properties. Assigning a camel-cased attribute on the style
    // object is defined as calling setProperty() with the same property name
    // and no priority, so setProperty() is used for every name. This also lets
    // ` !important` values keep their priority.
    for (const name in styleInfo) {
      const value = styleInfo[name];
      if (value != null) {
        this._previousStyleProperties.add(name);
        const isImportant =
          typeof value === 'string' && value.endsWith(importantFlag);
        style.setProperty(
          cssPropertyName(name),
          isImportant ? (value as string).slice(0, flagTrim) : String(value),
          isImportant ? important : ''
        );
      }
    }
    return noChange;
  }
}

/**
 * A directive that applies CSS properties to an element.
 *
 * `styleMap` can only be used in the `style` attribute and must be the only
 * expression in the attribute. It takes the property names in the
 * {@link StyleInfo styleInfo} object and adds the properties to the inline
 * style of the element.
 *
 * Property names with dashes (`-`) are assumed to be valid CSS property
 * names. Names without dashes are assumed to be camelCased JavaScript property
 * names, as found on the element's style object, and are converted to CSS
 * property names the same way the style object does (including `cssFloat` ->
 * `float` and `webkitTransform` -> `-webkit-transform`). Values ending in
 * ` !important` are set with the `important` priority.
 *
 * For example `styleMap({backgroundColor: 'red', 'border-top': '5px', '--size':
 * '0'})` sets the `background-color`, `border-top` and `--size` properties.
 *
 * @param styleInfo
 * @see {@link https://lit.dev/docs/templates/directives/#stylemap styleMap code samples on Lit.dev}
 */
export const styleMap = directive(StyleMapDirective);

/**
 * The type of the class that powers this directive. Necessary for naming the
 * directive's return type.
 */
export type {StyleMapDirective};
