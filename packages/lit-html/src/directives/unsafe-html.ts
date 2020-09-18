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
  directive,
  Directive,
  nothing,
  TemplateResult,
  noChange,
  PartInfo,
  NODE_PART,
} from '../lit-html.js';

const HTML_RESULT = 1;

/**
 * Renders the result as HTML, rather than text.
 *
 * Note, this is unsafe to use with any user-provided input that hasn't been
 * sanitized or escaped, as it may lead to cross-site-scripting
 * vulnerabilities.
 */
export const unsafeHTML = directive(
  class UnsafeHTML extends Directive {
    value: unknown = nothing;
    templateResult?: TemplateResult;

    constructor(part: PartInfo) {
      super();
      if (part.type !== NODE_PART) {
        throw new Error('unsafeHTML can only be used in text bindings');
      }
    }

    render(value: string) {
      // TODO: add tests for nothing and noChange
      if (value === nothing) {
        this.templateResult = undefined;
        return (this.value = value);
      }
      if (value === noChange) {
        return value;
      }
      if (typeof value != 'string') {
        throw new Error('unsafeHTML() called with a non-string value');
      }
      if (value === this.value) {
        return this.templateResult;
      }
      this.value = value;
      const strings = ([String(value)] as unknown) as TemplateStringsArray;
      (strings as any).raw = strings;
      // WARNING: impersonating a TemplateResult like this is extremely
      // dangerous. Third-party directives should not do this.
      return (this.templateResult = {
        _$litType$: HTML_RESULT,
        strings,
        values: [],
      });
    }
  }
);
