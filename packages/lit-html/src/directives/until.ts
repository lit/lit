/**
 * @license
 * Copyright (c) 2020 The Polymer Project Authors. All rights reserved.
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

import {Directive, directive, Part, PartInfo, noChange} from '../lit-html.js';
import {setPartValue} from '../parts.js';

const isPromiseLike = (x: unknown): x is PromiseLike<unknown> => {
  return typeof (x as undefined | null | {then?: unknown})?.then === 'function';
};

class UntilDirective extends Directive {
  private _attrPartIndex: undefined | number;
  private _latestUpdateId: number;

  constructor(_part: PartInfo, index?: number) {
    super();

    this._attrPartIndex = index;
    this._latestUpdateId = 0;
  }

  render(...values: Array<unknown>) {
    return values.find((x) => !isPromiseLike(x)) ?? noChange;
  }

  update(part: Part, values: Array<unknown>) {
    const updateId = ++this._latestUpdateId;
    let lastRenderedIndex = Infinity;
    let initialValueFound = false;
    let initialValue: unknown = noChange;

    for (let i = 0; i < values.length; i++) {
      const value = values[i];

      if (isPromiseLike(value)) {
        Promise.resolve(value).then((result) => {
          if (updateId === this._latestUpdateId && i < lastRenderedIndex) {
            lastRenderedIndex = i;
            setPartValue(part, result, this._attrPartIndex);
          }
        });
      } else if (!initialValueFound) {
        initialValueFound = true;
        initialValue = value;
        lastRenderedIndex = i;
      }
    }

    return initialValue;
  }
}

export const until = directive(UntilDirective);
