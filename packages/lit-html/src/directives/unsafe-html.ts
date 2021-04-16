/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {nothing, TemplateResult, noChange} from '../lit-html.js';
import {directive, Directive, PartInfo, PartType} from '../directive.js';

const HTML_RESULT = 1;

export class UnsafeHTMLDirective extends Directive {
  static directiveName = 'unsafeHTML';
  static resultType = HTML_RESULT;

  private _value: unknown = nothing;
  private _templateResult?: TemplateResult;

  constructor(partInfo: PartInfo) {
    super(partInfo);
    if (partInfo.type !== PartType.CHILD) {
      throw new Error(
        `${
          (this.constructor as typeof UnsafeHTMLDirective).directiveName
        }() can only be used in child bindings`
      );
    }
  }

  render(value: string | typeof nothing | typeof noChange) {
    // TODO: add tests for nothing and noChange
    if (value === nothing) {
      this._templateResult = undefined;
      return (this._value = value);
    }
    if (value === noChange) {
      return value;
    }
    if (typeof value != 'string') {
      throw new Error(
        `${
          (this.constructor as typeof UnsafeHTMLDirective).directiveName
        }() called with a non-string value`
      );
    }
    if (value === this._value) {
      return this._templateResult;
    }
    this._value = value;
    const strings = ([value] as unknown) as TemplateStringsArray;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (strings as any).raw = strings;
    // WARNING: impersonating a TemplateResult like this is extremely
    // dangerous. Third-party directives should not do this.
    return (this._templateResult = {
      // Cast to a known set of integers that satisfy ResultType so that we
      // don't have to export ResultType and possibly encourage this pattern.
      _$litType$: (this.constructor as typeof UnsafeHTMLDirective)
        .resultType as 1 | 2,
      strings,
      values: [],
    });
  }
}

/**
 * Renders the result as HTML, rather than text.
 *
 * Note, this is unsafe to use with any user-provided input that hasn't been
 * sanitized or escaped, as it may lead to cross-site-scripting
 * vulnerabilities.
 */
export const unsafeHTML = directive(UnsafeHTMLDirective);
