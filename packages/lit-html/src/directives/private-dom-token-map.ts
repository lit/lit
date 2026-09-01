/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {AttributePart, noChange} from '../lit-html.js';
import {
  Directive,
  DirectiveParameters,
  PartInfo,
  PartType,
} from '../directive.js';

/**
 * A key-value set of token names (CSS classes or CSS parts) to truthy values.
 */
export interface DOMTokenMap {
  [name: string]: string | boolean | number;
}

/**
 * The attributes supported by {@link DOMTokenMapDirective} subclasses.
 */
export enum DOMTokenAttribute {
  CLASS = 'class',
  PART = 'part',
}

// `class` doesn't expose its DOMTokenList via a same-named property.
const tokenLists: Record<
  DOMTokenAttribute,
  (element: Element) => DOMTokenList
> = {
  [DOMTokenAttribute.CLASS]: (element) => (element as HTMLElement).classList,
  [DOMTokenAttribute.PART]: (element) => element.part,
};

/**
 * Base class for directives, like `classMap` and `partMap`, that
 * bind an object of token names to truthy values to a `DOMTokenList`-backed
 * attribute (`class` or `part`).
 */
export abstract class DOMTokenMapDirective extends Directive {
  /**
   * Stores the DOMTokenMap object applied to a given AttributePart.
   * Used to unset existing values when a new DOMTokenMap object is applied.
   */
  private _previousTokens?: Set<string>;
  private _staticTokens?: Set<string>;

  constructor(
    partInfo: PartInfo,
    private readonly attributeName: DOMTokenAttribute
  ) {
    super(partInfo);
    if (
      partInfo.type !== PartType.ATTRIBUTE ||
      partInfo.name !== attributeName ||
      (partInfo.strings?.length as number) > 2
    ) {
      throw new Error(
        `\`${attributeName}Map()\` can only be used in the \`${attributeName}\` attribute ` +
          'and must be the only part in the attribute.'
      );
    }
  }

  render(tokenInfo: DOMTokenMap) {
    // Add spaces to ensure separation from static tokens
    return (
      ' ' +
      Object.keys(tokenInfo)
        .filter((key) => tokenInfo[key])
        .join(' ') +
      ' '
    );
  }

  override update(part: AttributePart, [tokenInfo]: DirectiveParameters<this>) {
    // Remember dynamic tokens on the first render
    if (this._previousTokens === undefined) {
      this._previousTokens = new Set();
      if (part.strings !== undefined) {
        this._staticTokens = new Set(
          part.strings
            .join(' ')
            .split(/\s/)
            .filter((s) => s !== '')
        );
      }
      for (const name in tokenInfo) {
        if (tokenInfo[name] && !this._staticTokens?.has(name)) {
          this._previousTokens.add(name);
        }
      }
      return this.render(tokenInfo);
    }

    const tokenList = tokenLists[this.attributeName](part.element);

    // Remove old tokens that no longer apply
    for (const name of this._previousTokens) {
      if (!(name in tokenInfo)) {
        tokenList.remove(name);
        this._previousTokens!.delete(name);
      }
    }

    // Add or remove tokens based on their map value
    for (const name in tokenInfo) {
      // We explicitly want a loose truthy check of `value` because it seems
      // more convenient that '' and 0 are skipped.
      const value = !!tokenInfo[name];
      if (
        value !== this._previousTokens.has(name) &&
        !this._staticTokens?.has(name)
      ) {
        if (value) {
          tokenList.add(name);
          this._previousTokens.add(name);
        } else {
          tokenList.remove(name);
          this._previousTokens.delete(name);
        }
      }
    }
    return noChange;
  }
}
