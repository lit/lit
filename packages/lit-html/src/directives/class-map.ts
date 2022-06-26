/**
 * @license
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
 * A key-value set of class names to truthy values.
 */
export interface ClassInfo {
  readonly [name: string]: string | boolean | number;
}

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
      (partInfo.strings?.length as number) > 2
    ) {
      throw new Error(
        '`classMap()` can only be used in the `class` attribute ' +
          'and must be the only part in the attribute.'
      );
    }
  }

  render(classInfo: ClassInfo) {
    // Add spaces to ensure separation from static classes
    return (
      ' ' +
      Object.keys(classInfo)
        .filter((key) => classInfo[key])
        .join(' ') +
      ' '
    );
  }

  override update(part: AttributePart, [classInfo]: DirectiveParameters<this>) {
    // Remember dynamic classes on the first render
    if (this._previousClasses === undefined) {
      this._previousClasses = new Set();
      if (part.strings !== undefined) {
        this._staticClasses = new Set(
          part.strings
            .join(' ')
            .split(/\s/)
            .filter((s) => s !== '')
        );
      }
      for (const key in classInfo) {
        // Account for object keys containing multiple class names separated by whitespace.
        const names = key.split(/\s/).filter((s) => s !== '');
        for (const name of names) {
          if (classInfo[key] && !this._staticClasses?.has(name)) {
            this._previousClasses.add(name);
          }
        }
      }
      return this.render(classInfo);
    }

    const classList = part.element.classList;
    const classInfoKeys = Object.keys(classInfo);

    // Remove old classes that no longer apply
    // We use forEach() instead of for-of so that we don't require down-level
    // iteration.
    this._previousClasses.forEach((name) => {
      // Check for strict equality or if a object key contains the name as a substring.
      if (
        !(name in classInfo) &&
        !classInfoKeys.some((key) => key.includes(name))
      ) {
        classList.remove(name);
        this._previousClasses!.delete(name);
      }
    });

    // Add or remove classes based on their classMap value
    for (const key in classInfo) {
      // We explicitly want a loose truthy check of `value` because it seems
      // more convenient that '' and 0 are skipped.
      const value = !!classInfo[key];
      const names = key.split(/\s/).filter((s) => s !== '');
      for (const name of names) {
        if (
          value !== this._previousClasses.has(name) &&
          !this._staticClasses?.has(name)
        ) {
          if (value) {
            classList.add(name);
            this._previousClasses.add(name);
          } else {
            classList.remove(name);
            this._previousClasses.delete(name);
          }
        }
      }
    }
    return noChange;
  }
}

/**
 * A directive that applies dynamic CSS classes.
 *
 * This must be used in the `class` attribute and must be the only part used in
 * the attribute. It takes each property in the `classInfo` argument and adds
 * the property name to the element's `classList` if the property value is
 * truthy; if the property value is falsey, the property name is removed from
 * the element's `class`.
 *
 * For example `{foo: bar}` applies the class `foo` if the value of `bar` is
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
