/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {TemplateResult} from 'lit-html';
import {isTemplateResult} from 'lit-html/directive-helpers.js';
import type {
  RenderResult,
  Thunk,
  ThunkedRenderResult,
} from '../render-result.js';
import {renderThunked} from '../render.js';

export function renderThunkedInShadowRealm(value: string) {
  const deserializedValue: TemplateResult = JSON.parse(value);
  patchLitTemplate(deserializedValue);
  return toArrayResult(renderThunked(deserializedValue));
}

function patchLitTemplate(template: TemplateResult) {
  if (!isTemplateResult(template)) {
    return;
  }

  Object.assign(template.strings, {raw: template.strings});
  for (const value of template.values) {
    if (isTemplateResult(value)) {
      patchLitTemplate(value as TemplateResult);
    }
  }
}

function toArrayResult(result: ThunkedRenderResult) {
  let index = 0;
  return function _$litRenderArray() {
    if (index >= result.length) {
      return null;
    }

    let value:
      | string
      | Thunk
      | Promise<string | RenderResult | ThunkedRenderResult>
      | RenderResult
      | ReturnType<Thunk> = result[index++];
    while (typeof value === 'function') {
      value = value();
    }

    if (value == null) {
      // We must not return null/undefined, as this implies
      // the end of the array.
      return '';
    } else if (typeof value === 'string') {
      return value;
    } else if (
      Array.isArray(value) ||
      typeof (value as RenderResult)[Symbol.iterator] === 'function'
    ) {
      return toArrayResult(
        Array.isArray(value)
          ? value
          : (Array.from(value as RenderResult) as ThunkedRenderResult)
      );
    }
    // Must be a Promise
    if (typeof (value as Promise<unknown>).then !== 'function') {
      throw new Error(
        `Unexpected value in RenderResult: ${value} (${typeof value})`
      );
    }
    return toPromiseResult(
      value as Promise<string | ThunkedRenderResult | RenderResult>
    );
  };
}

function toPromiseResult(
  result: Promise<string | ThunkedRenderResult | RenderResult>
) {
  return function _$litRenderPromise(
    resolve: (value: string | Thunk) => void,
    reject: (reason: string) => void
  ) {
    result.then(
      (value) => {
        if (value == null) {
          resolve('');
        } else if (typeof value === 'string') {
          resolve(value);
        } else if (
          Array.isArray(value) ||
          typeof (value as RenderResult)[Symbol.iterator] === 'function'
        ) {
          const arrayResult = toArrayResult(
            Array.isArray(value)
              ? value
              : (Array.from(value as RenderResult) as ThunkedRenderResult)
          );
          resolve(arrayResult as unknown as Thunk);
        } else {
          reject(
            `Unexpected value in RenderResult: ${value} (${typeof value})`
          );
        }
      },
      (err) => reject(String(err))
    );
  };
}
