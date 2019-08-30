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
const previousClassesCache = new WeakMap<Part, Set<string>>();

/**
 * A directive that applies CSS classes. This must be used in the `class`
 * attribute and must be the only part used in the attribute. It takes each
 * property in the `classInfo` argument and adds the property name to the
 * element's `classList` if the property value is truthy; if the property value
 * is falsey, the property name is removed from the element's `classList`. For
 * example
 * `{foo: bar}` applies the class `foo` if the value of `bar` is truthy.
 * @param classInfo {ClassInfo}
 */
export const classMap = directive((classInfo: ClassInfo) => (part: Part) => {
  if (!(part instanceof AttributePart) || (part instanceof PropertyPart) ||
      part.committer.name !== 'class' || part.committer.parts.length > 1) {
    throw new Error(
        'The `classMap` directive must be used in the `class` attribute ' +
        'and must be the only part in the attribute.');
  }

  const {committer} = part;
  const {element} = committer;

  let previousClasses = previousClassesCache.get(part);
  if (previousClasses === undefined) {
    // Write static classes once
    element.className = committer.strings.join(' ');
    previousClassesCache.set(part, previousClasses = new Set());
  }

  const {classList} = element;

  // Remove old classes that no longer apply
  for (const name of previousClasses) {
    if (!(name in classInfo)) {
      classList.remove(name);
      previousClasses.delete(name);
    }
  }

  // Add or remove classes based on their classMap value
  for (const name in classInfo) {
    const value = classInfo[name];
    // We explicitly want a loose truthy check of `value` because it seems more
    // convenient that '' and 0 are skipped.
    // tslint:disable-next-line: triple-equals
    if (value != previousClasses.has(name)) {
      if (value) {
        classList.add(name);
        previousClasses.add(name);
      } else {
        classList.remove(name);
        previousClasses.delete(name);
      }
    }
  }
});
