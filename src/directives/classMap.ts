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


// On IE11, classList.toggle doesn't accept a second argument.
// Since this is so minor, we just polyfill it.
if (window.navigator.userAgent.match('Trident')) {
  DOMTokenList.prototype.toggle = function(
      token: string, force?: boolean|undefined) {
    if (force === undefined || force) {
      this.add(token);
    } else {
      this.remove(token);
    }
    return force === undefined ? true : force;
  };
}

export interface ClassInfo {
  [name: string]: string|boolean|number;
}

/**
 * Stores the ClassInfo object applied to a given AttributePart.
 * Used to unset existing values when a new ClassInfo object is applied.
 */
const classMapCache = new WeakMap();

/**
 * Stores AttributeParts that have had static classes applied (e.g. `foo` in
 * class="foo ${classMap()}"). Static classes are applied only the first time
 * the directive is run on a part.
 */
// Note, could be a WeakSet, but prefer not requiring this polyfill.
const classMapStatics = new WeakMap();

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
export const classMap = (classInfo: ClassInfo): Directive<AttributePart> =>
    directive((part: AttributePart) => {
      if (!(part instanceof AttributePart) || (part instanceof PropertyPart) ||
          part.committer.name !== 'class' || part.committer.parts.length > 1) {
        throw new Error(
            'The `classMap` directive must be used in the `class` attribute ' +
            'and must be the only part in the attribute.');
      }
      // handle static classes
      if (!classMapStatics.has(part)) {
        part.committer.element.className = part.committer.strings.join(' ');
        classMapStatics.set(part, true);
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
          part.committer.element.classList.toggle(
              name, Boolean(classInfo[name]));
        }
      }
      classMapCache.set(part, classInfo);
    });