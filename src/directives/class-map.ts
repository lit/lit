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
 */
const previousClassesCache = new WeakMap<Part, Map<string, unknown>>();

const staticValue = {};

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
    // Ensure static classes are never removed
    element.className = committer.strings.join(' ');
    committer.strings.forEach(s => previousClasses!.set(s, staticValue));
    changed = true;
  }

  // Remove old classes that no longer apply
  // We use forEach() instead of for-of so that re don't require down-level
  // iteration.
  previousClasses.forEach((value: unknown, key: string) => {
    if (value !== staticValue && !(key in classInfo)) {
      changed = true;
      previousClasses!.delete(name);
    }
  });

  // Add or remove classes based on their classMap value
  for (const name in classInfo) {
    const value = classInfo[name];
    // We explicitly want a loose truthy check of `value` because it seems more
    // convenient that '' and 0 are skipped.
    if (value != previousClasses.has(name)) {
      changed = true;
      if (value) {
        previousClasses.set(name, true);
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