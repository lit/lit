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

export interface ClassInfo {
  readonly [name: string]: string|boolean|number;
}

/**
 * Stores the ClassInfo object applied to a given AttributePart.
 * Used to unset existing values when a new ClassInfo object is applied.
 *
 * The map contains two possible class values:
 * 1. Static (given through the template literal), which are set to true
 * 2. Dynamic (given through ClassInfo) which are set to false
 *
 * Only Dynamic classes can be removed by being omitted from the ClassInfo, but
 * both Static and Dynamic classes can be removed by setting class to falsey in
 * the ClassInfo.
 */
const previousClassesCache = new WeakMap<Part, Map<string, boolean>>();

/**
 * Classes are parsed as a series of tokens separated by ASCII whitespace. This
 * token splitter allows us to extract the tokens from the static classes given
 * in th template literal.
 *
 * https://html.spec.whatwg.org/multipage/dom.html#classes
 * https://html.spec.whatwg.org/multipage/common-microsyntaxes.html#set-of-space-separated-tokens
 * https://infra.spec.whatwg.org/#ascii-whitespace
 */
const tokenSplitter = /[\t\n\f\r ]+/;

/**
 * A directive that applies CSS classes. This must be used in the `class`
 * attribute and must be the only part used in the attribute. It takes each
 * property in the `classInfo` argument and adds the property name to the
 * element's `class` if the property value is truthy; if the property value is
 * falsey, the property name is removed from the element's `class`. For example
 * `{foo: bar}` applies the class `foo` if the value of `bar` is truthy.
 * @param classInfo {ClassInfo}
 */
export const classMap = directive((classInfo: ClassInfo) => (part: Part) => {
  if (!(part instanceof AttributePart) || part instanceof PropertyPart ||
      part.committer.name !== 'class' || part.committer.parts.length > 1) {
    throw new Error(
        'The `classMap` directive must be used in the `class` attribute ' +
        'and must be the only part in the attribute.');
  }

  const {committer} = part;
  const {element} = committer;
  let changed = false;

  let previousClasses = previousClassesCache.get(part);
  if (previousClasses === undefined) {
    previousClasses = new Map();
    previousClassesCache.set(part, previousClasses);
    // Normalize all static classes into individual tokens. This is necessary
    // since each individual string could contain multiple tokens.
    const strings = committer.strings.join(' ').split(tokenSplitter);
    // Ensure static classes are never removed, by setting them to true
    strings.forEach(s => previousClasses!.set(s, true));
    changed = true;
  }

  // Remove old classes that no longer apply
  // We use forEach() instead of for-of so that re don't require down-level
  // iteration.
  previousClasses.forEach((value: unknown, name: string) => {
    // If the value is true, then it was a static class, which we do not remove
    // unless the ClassInfo specifically overrides it.
    if (value !== true && !(name in classInfo)) {
      changed = true;
      previousClasses!.delete(name);
    }
  });

  // Add or remove classes based on their ClassInfo value
  for (const name in classInfo) {
    const value = classInfo[name];
    // We explicitly want a loose truthy check of `value` because it seems more
    // convenient that '' and 0 are skipped.
    if (value != previousClasses.has(name)) {
      changed = true;
      if (value) {
        // Dynamic classes are set to false, so we know to remove them when
        // omitted from the ClassInfo.
        previousClasses.set(name, false);
      } else {
        previousClasses.delete(name);
      }
    }
  }

  if (changed) {
    const classes: string[] = [];
    previousClasses.forEach((_: unknown, key: string) => classes.push(key));
    element.setAttribute('class', classes.join(' '));
  }
});