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

import {
  AttributePart,
  directive,
  Directive,
  noChange,
  PartInfo,
  ATTRIBUTE_PART,
} from '../lit-html.js';

// IE11 doesn't support classList on SVG elements, so we emulate it with a Set
// TODO (justinfagnani): Can we move this to the IE compat patch?
class ClassList {
  element: Element;
  classes: Set<string> = new Set();
  changed = false;

  constructor(element: Element) {
    this.element = element;
    const classList = (element.getAttribute('class') || '').split(/\s+/);
    for (const cls of classList) {
      this.classes.add(cls);
    }
  }
  add(cls: string) {
    this.classes.add(cls);
    this.changed = true;
  }

  remove(cls: string) {
    this.classes.delete(cls);
    this.changed = true;
  }

  commit() {
    if (this.changed) {
      let classString = '';
      this.classes.forEach((cls) => (classString += cls + ' '));
      this.element.setAttribute('class', classString);
    }
  }
}

export interface ClassInfo {
  readonly [name: string]: string | boolean | number;
}

/**
 * A directive that applies CSS classes. This must be used in the `class`
 * attribute and must be the only part used in the attribute. It takes each
 * property in the `classInfo` argument and adds the property name to the
 * element's `class` if the property value is truthy; if the property value is
 * falsey, the property name is removed from the element's `class`. For example
 * `{foo: bar}` applies the class `foo` if the value of `bar` is truthy.
 * @param classInfo {ClassInfo}
 */
class ClassMap extends Directive {
  /**
   * Stores the ClassInfo object applied to a given AttributePart.
   * Used to unset existing values when a new ClassInfo object is applied.
   */
  previousClasses?: Set<string>;

  constructor(part: PartInfo) {
    super();
    if (
      part.type !== ATTRIBUTE_PART ||
      part.name !== 'class' ||
      (part.strings !== undefined && part.strings.length > 2)
    ) {
      throw new Error(
        'The `classMap` directive must be used in the `class` attribute ' +
          'and must be the only part in the attribute.'
      );
    }
  }

  render(classInfo: ClassInfo) {
    return Array.from(Object.entries(classInfo))
      .filter(([_, enabled]) => enabled)
      .map(([name, _]) => name)
      .join(' ');
  }

  update(part: AttributePart, [classInfo]: [ClassInfo]) {
    // Remember dynamic classes on the first render
    if (this.previousClasses === undefined) {
      this.previousClasses = new Set();
      for (const name in classInfo) {
        if (classInfo[name]) {
          this.previousClasses.add(name);
        }
      }
      return this.render(classInfo);
    }

    const element = part.element;
    const classList = (element.classList || new ClassList(element)) as
      | DOMTokenList
      | ClassList;

    // Remove old classes that no longer apply
    // We use forEach() instead of for-of so that re don't require down-level
    // iteration.
    this.previousClasses.forEach((name) => {
      if (!(name in classInfo)) {
        classList.remove(name);
        this.previousClasses!.delete(name);
      }
    });

    // Add or remove classes based on their classMap value
    for (const name in classInfo) {
      const value = classInfo[name];
      if (value != this.previousClasses.has(name)) {
        // We explicitly want a loose truthy check of `value` because it seems
        // more convenient that '' and 0 are skipped.
        if (value) {
          classList.add(name);
          this.previousClasses.add(name);
        } else {
          classList.remove(name);
          this.previousClasses.delete(name);
        }
      }
    }
    if (typeof (classList as ClassList).commit === 'function') {
      (classList as ClassList).commit();
    }
    return noChange;
  }
}

export const classMap = directive(ClassMap);
