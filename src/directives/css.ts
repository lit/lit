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

import {directive, Directive, AttributePart, PropertyPart} from '../lit-html.js';

export interface ClassInfo {
  [name: string]: string|boolean|number;
}

export interface StyleInfo {
  [name: string]: string;
}

const classMapCache = new WeakMap();
const classMapStatics = new WeakSet();

/**
 * A directive that applies css classes. This must be used in the `class` attribute.
 * It takes the properties in the `classInfo` argument and applies each
 * property name to the element's `classList` based on if the property value is truthy.
 * For example `{foo: bar}` applies the class `foo` if the value of `bar` is truthy.
 * @param classInfo {ClassInfo}
 */
export const classMap = (classInfo: ClassInfo): Directive<AttributePart> =>
  directive((part: AttributePart) => {
    if (!(part instanceof AttributePart) || (part instanceof PropertyPart) ||
        part.committer.name !== 'class' || part.committer.parts.length > 1) {
      throw new Error('The `classMap` directive must be used in the `class` attribute ' +
          'and must be the only part in the attribute.');
    }
    // handle static classes
    if (!classMapStatics.has(part)) {
      part.committer.element.className =
          part.committer.strings.reduce((a, c) => `${a} ${c}`);
      classMapStatics.add(part);
    }
    // remove old classes that no longer apply
    const oldInfo = classMapCache.get(part);
    for (const name in oldInfo) {
      if (!(name in classInfo)) {
        part.committer.element.classList.remove(name);
      }
    }
    // add new classes
    for (const name in classInfo) {
      if (!oldInfo || (oldInfo[name] !== classInfo[name])) {
        // We explicitly want a loose truthy check here because
        // it seems more convenient that '' and 0 are skipped.
        part.committer.element.classList.toggle(name, Boolean(classInfo[name]));
      }
    }
    classMapCache.set(part, classInfo);
});

const styleMapCache = new WeakMap();
const styleMapStatics = new WeakSet();

/**
 * A directive that applies css properties. This must be used in the `style` attribute.
 * It takes the property names in the `styleInfo` object and applies the property
 * values as a css style propertes. For example `{backgroundColor: 'red', borderTop: '5px'}`
 * sets these properties to the element's style.
 * @param styleInfo {StyleInfo}
 */
export const styleMap = (styleInfo: StyleInfo): Directive<AttributePart> =>
  directive((part: AttributePart) => {
    if (!(part instanceof AttributePart) || (part instanceof PropertyPart) ||
        part.committer.name !== 'style' || part.committer.parts.length > 1) {
      throw new Error('The `styleMap` directive must be used in the style attribute ' +
          'and must be the only part in the attribute.');
    }
    // handle static styles
    if (!styleMapStatics.has(part)) {
      (part.committer.element as HTMLElement).style.cssText =
          part.committer.strings.reduce((a, c) => `${a} ${c}`);
      styleMapStatics.add(part);
    }
    // remove old styles that no longer apply
    const oldInfo = styleMapCache.get(part);
    for (const name in oldInfo) {
      if (!(name in styleInfo)) {
        // setting to `null` to "unset" a previously applied value.
        ((part.committer.element as HTMLElement).style as any)[name] = null;
      }
    }
    Object.assign((part.committer.element as HTMLElement).style, styleInfo);
    styleMapCache.set(part, styleInfo);
});