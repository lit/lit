/**
 * @license
 * Copyright 2018 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {AttributePart, noChange, nothing} from '../lit-html.js';
import {
  directive,
  Directive,
  DirectiveParameters,
  PartInfo,
  PartType,
} from '../directive.js';

/**
 * A key-value set of class names to truthy values.
 */
interface KeyValueClassInfo {
  [name: string]: string | boolean | number;
}

/**
 * String, an Array, any falsy value, or a key-value set of class names to truthy values.
 */
export type ClassInfo =
  | Array<ClassInfo>
  | KeyValueClassInfo
  | string
  | false
  | null
  | undefined
  | typeof nothing;

// Split by spaces, tabs, newlines, etc.
const RX_CLASS_SPLIT = /\s+/;

// Recursively walk through the classInfo and return an array of resulting classes
const mapClassesRecursive = (classInfo: ClassInfo): string[] => {
  if (!classInfo || classInfo === nothing) {
    return [];
  } else if (Array.isArray(classInfo)) {
    return classInfo.flatMap((c) => mapClassesRecursive(c));
  } else if (typeof classInfo === 'object') {
    return Object.entries(classInfo)
      .filter(([, value]) => !!value)
      .reduce(
        (arr, [key]) => arr.concat(mapClassesRecursive(key)),
        [] as string[]
      );
  }
  // Take the toString() value as a fallback
  return `${classInfo}`.split(RX_CLASS_SPLIT);
};

// Join the classes back to a single string
const joinClasses = (set: Set<string>) => ` ${Array.from(set).join(' ')} `;

class ClassMapDirective extends Directive {
  /**
   * Stores the ClassInfo object applied to a given AttributePart.
   * Used to unset existing values when a new ClassInfo object is applied.
   */
  private _previousClasses?: Set<string>;
  private _staticClasses?: Set<string>;

  constructor(partInfo: PartInfo) {
    super(partInfo);
    if (
      partInfo.type !== PartType.ATTRIBUTE ||
      partInfo.name !== 'class' ||
      (partInfo.strings?.length ?? 0) > 2
    ) {
      throw new Error(
        '`classes()` can only be used in the `class` attribute and must be the only part in the attribute.'
      );
    }
  }

  render(...classInfo: ClassInfo[]) {
    return joinClasses(new Set(mapClassesRecursive(classInfo)));
  }

  override update(part: AttributePart, classInfo: DirectiveParameters<this>) {
    const merged = new Set(mapClassesRecursive(classInfo));

    // Remember dynamic classes on the first render
    if (this._previousClasses === undefined) {
      this._previousClasses = new Set();
      this._staticClasses = new Set(
        part.strings
          ?.join(' ')
          .split(/\s/)
          .filter((s) => s !== '')
      );

      for (const name of merged) {
        if (!this._staticClasses!.has(name)) {
          this._previousClasses!.add(name);
        }
      }

      return joinClasses(merged);
    }

    const classList = part.element.classList;

    // Remove old classes that no longer apply
    for (const name of this._previousClasses) {
      if (!merged.has(name)) {
        classList.remove(name);
        this._previousClasses?.delete(name);
      }
    }

    // Add or remove classes based on their classMap value
    for (const name of merged) {
      if (
        !this._staticClasses!.has(name) &&
        !this._previousClasses!.has(name)
      ) {
        classList.add(name);
        this._previousClasses?.add(name);
      }
    }
    return noChange;
  }
}

/**
 * A directive that applies dynamic CSS classes.
 *
 * This must be used in the `class` attribute and must be the only part used in
 * the attribute. Each property in the `classInfo` arguments can either be
 * a key-value object, a String or an Array.
 * Arrays are processed recursively, while strings are added
 * as such. For objects, the keys are added to the element's `classList`
 * if the property value is truthy; if the property value is falsy,
 * the property name is removed from the element's `class`.
 *
 * For example, `{foo: bar}` applies the class `foo` if the value of `bar` is
 * truthy.
 *
 * @param classInfo
 */
export const classMap = directive(ClassMapDirective);

/**
 * The type of the class that powers this directive. Necessary for naming the
 * directive's return type.
 */
export type {ClassMapDirective};
