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

import {
  AttributePart,
  Directive,
  directive,
  Part,
  PartInfo,
  nothing,
} from '../lit-html.js';
import {setPartValue} from '../parts.js';

class UntilDirective extends Directive {
  private _index: undefined | number;
  private _latestUpdateId: number;
  private _seenPromises: WeakSet<Promise<unknown>>;
  private _resolvedPromises: WeakMap<Promise<unknown>, unknown>;

  constructor(_part: PartInfo, index?: number) {
    super();

    this._index = index;
    this._latestUpdateId = 0;
    this._seenPromises = new WeakSet();
    this._resolvedPromises = new WeakMap();
  }

  render(...values: Array<unknown>) {
    for (const value of values) {
      if (!(value instanceof Promise)) {
        return value;
      } else if (this._resolvedPromises.has(value)) {
        return this._resolvedPromises.get(value);
      }
    }

    return nothing;
  }

  update(part: Part, values: Array<unknown>) {
    const updateId = ++this._latestUpdateId;

    for (const value of values) {
      if (value instanceof Promise) {
        if (!this._seenPromises.has(value)) {
          this._seenPromises.add(value);
          value.then((x) => {
            this._resolvedPromises.set(value, x);
          });
        }

        value.then(() => {
          if (updateId === this._latestUpdateId) {
            if ((part as AttributePart).strings !== undefined) {
              setPartValue(part, this.render(...values), this._index as number);
            } else {
              setPartValue(part, this.render(...values));
            }
          }
        });
      }
    }

    return this.render(...values);
  }
}

export const until = directive(UntilDirective);
