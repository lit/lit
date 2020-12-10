/**
 * @license
 * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
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
  nothing,
  TemplateResult,
  noChange,
  PartInfo,
  NODE_PART,
} from '../lit-html.js';
import {directive, Directive} from '../directive.js';

const HTML_RESULT = 1;

export class UnsafeHTML extends Directive {
  static directiveName = 'unsafeHTML';
  static resultType = HTML_RESULT;

  value: unknown = nothing;
  templateResult?: TemplateResult;

  constructor(partInfo: PartInfo) {
    super(partInfo);
    if (partInfo.type !== NODE_PART) {
      throw new Error(
        `${
          (this.constructor as typeof UnsafeHTML).directiveName
        }() can only be used in text bindings`
      );
    }
  }

  render(value: string | typeof nothing | typeof noChange) {
    // TODO: add tests for nothing and noChange
    if (value === nothing) {
      this.templateResult = undefined;
      return (this.value = value);
    }
    if (value === noChange) {
      return value;
    }
    if (typeof value != 'string') {
      throw new Error(
        `${
          (this.constructor as typeof UnsafeHTML).directiveName
        }() called with a non-string value`
      );
    }
    if (value === this.value) {
      return this.templateResult;
    }
    this.value = value;
    const strings = ([value] as unknown) as TemplateStringsArray;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (strings as any).raw = strings;
    // WARNING: impersonating a TemplateResult like this is extremely
    // dangerous. Third-party directives should not do this.
    return (this.templateResult = {
      // Cast to a known set of integers that satisfy ResultType so that we
      // don't have to export ResultType and possibly encourage this pattern.
      _$litType$: (this.constructor as typeof UnsafeHTML).resultType as 1 | 2,
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
export const unsafeHTML = directive(UnsafeHTML);
