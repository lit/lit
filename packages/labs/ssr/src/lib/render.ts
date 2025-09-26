/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {isTemplateResult} from 'lit-html/directive-helpers.js';
import {LitElementRenderer} from './lit-element-renderer.js';
import type {
  ThunkedRenderResult,
  RenderResult,
  Thunk,
} from './render-result.js';
import type {RenderInfo} from './render-value.js';
import {renderValue} from './render-value.js';
import {isHydratable} from './server-template.js';

export type {RenderResult} from './render-result.js';
export type {RenderInfo} from './render-value.js';

/**
 * Renders a lit-html renderable, usually a template result, to an iterable.
 *
 * When consuming the result, Promises *must* be awaited before retrieving
 * subsequent values. If Promises are not awaited, or not awaited in the correct
 * order, the output will be incorrect.
 *
 * @param value Value to render
 * @param renderInfo Optional render context object that should be passed to any
 *   reentrant calls to `render`, e.g. from a `renderShadow` callback on an
 *   ElementRenderer.
 */
export function render(
  value: unknown,
  renderInfo?: Partial<RenderInfo>
): RenderResult {
  return new RenderResultIterator(renderThunked(value, renderInfo));
}

/**
 * Renders a lit-html template (or any renderable lit-html value) to a thunk
 * array. Any custom elements encountered will be rendered if a matching
 * ElementRenderer is found.
 *
 * This method is suitable for streaming the contents of the element.
 *
 * When consuming the result, thunks *must* be called in order to obtain their
 * values. If thunks are not called, or not called in the correct order, the
 * output will be incorrect.
 *
 * @param value Value to render
 * @param renderInfo Optional render context object that should be passed to any
 *   reentrant calls to `render`, e.g. from a `renderShadow` callback on an
 *   ElementRenderer.
 */
export function renderThunked(
  value: unknown,
  renderInfo?: Partial<RenderInfo>
): ThunkedRenderResult {
  const defaultRenderInfo = {
    elementRenderers: [LitElementRenderer],
    customElementInstanceStack: [],
    customElementHostStack: [],
    eventTargetStack: [],
    slotStack: [],
    deferHydration: false,
  } satisfies RenderInfo;
  renderInfo = {...defaultRenderInfo, ...renderInfo};
  let hydratable = true;
  if (isTemplateResult(value)) {
    hydratable = isHydratable(value);
  }
  return renderValue(value, renderInfo as RenderInfo, hydratable);
}

type InternalRenderResultIterator = Iterator<string | Thunk>;

/**
 * Wraps a ThunkedRenderResult to implement a RenderResult.
 */
export class RenderResultIterator
  implements Iterator<string | Promise<RenderResult>>
{
  /**
   * A stack of open iterators.
   *
   * As the ThunkedRenderResult thunks are called, they may yield new arrays of
   * strings and/or thunks. We push the iterators for these arrays onto the
   * stack and consume them depth-first.
   */
  private _iterators: Array<InternalRenderResultIterator>;
  private _waiting = false;

  constructor(result: ThunkedRenderResult) {
    this._iterators = [result[Symbol.iterator]()];
  }

  next(): IteratorResult<string | Promise<RenderResult>, unknown> {
    if (this._waiting) {
      throw new Error(
        'Cannot call next() while waiting for a Promise to resolve'
      );
    }
    const iterator = this._iterators.at(-1);
    if (iterator === undefined) {
      return {done: true, value: undefined};
    }

    // Get the next value from the current iterator
    const result = iterator.next();
    if (result.done) {
      this._iterators.pop();
      return this.next();
    }
    let value: string | Thunk | ReturnType<Thunk> = result.value;

    // If the value is a string, return the result as-is:
    if (typeof value === 'string') {
      return result as IteratorResult<string, unknown>;
    }

    // Otherwise, it's a thunk. Trampoline to fully evaluate thunks:
    while (typeof value === 'function') {
      value = value();
    }

    // If the value is a string, return a new iterator result:
    if (typeof value === 'string') {
      return {done: false, value};
    }

    // If the value is an array, push a new iterator for it onto the stack, and
    // recurse to start consuming it:
    if (Array.isArray(value)) {
      this._iterators.push(value[Symbol.iterator]());
      return this.next();
    }

    // The value is a Promise. Convert to a Promise<RenderResult>:
    this._waiting = true;
    return {
      done: false,
      value: value.then((r) => {
        if (typeof r === 'string') {
          return r;
        }
        // Instead of returning a new iterator, flatten the array into our
        // iterator stack:
        this._iterators.push(r[Symbol.iterator]());
        this._waiting = false;
        return this;
      }),
    };
  }

  // Make the iterator itself iterable
  [Symbol.iterator](): Iterator<string | Promise<RenderResult>> {
    return this;
  }
}
