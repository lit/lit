/**
 * @license
 * Copyright (c) 2020 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt The complete set of authors may be found
 * at http://polymer.github.io/AUTHORS.txt The complete set of contributors may
 * be found at http://polymer.github.io/CONTRIBUTORS.txt Code distributed by
 * Google as part of the polymer project is also subject to an additional IP
 * rights grant found at http://polymer.github.io/PATENTS.txt
 */

import {TemplateResult} from 'lit-html';

/* eslint-disable @typescript-eslint/no-explicit-any */

export function msg(id: string, template: string): string;

export function msg(id: string, template: TemplateResult): TemplateResult;

export function msg<F extends (...args: any[]) => string>(
  id: string,
  fn: F,
  ...params: Parameters<F>
): string;

export function msg<F extends (...args: any[]) => TemplateResult>(
  id: string,
  fn: F,
  ...params: Parameters<F>
): TemplateResult;

/**
 * TODO(aomarks) This is a temporary stub implementation of the msg function. It
 * does not yet support actual localization, and is only used by the "transform"
 * output mode, since the user needs something to import.
 *
 * It may actually make more sense to move most of the generated code from
 * "runtime" mode into this library, so that users can
 * `import {msg} from 'lit-localize'` and tell it where to fetch translation
 * (this will make more sense after the planned revamp to support runtime async
 * locale loading and re-rendering).
 */
export function msg(
  _id: string,
  template: string | TemplateResult | (() => string | TemplateResult),
  ...params: any[]
): string | TemplateResult {
  if (typeof template === 'function') {
    return (template as any)(...params);
  }
  return template;
}
