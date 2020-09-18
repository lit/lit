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

// import {isPrimitive} from '../lib/parts.js';
import {
  directive,
  NodePart,
  Part,
  Directive,
  nothing,
  TemplateResult,
  noChange,
} from '../lit-html.js';

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

    constructor(part: Part) {
      super();
      // TODO (justinfagnani): We probably don't want to use instanceof
      if (!(part instanceof NodePart)) {
        throw new Error('unsafeHTML can only be used in text bindings');
      }
    }

    render(value: unknown) {
      // TODO: add tests for nothing and noChange
      if (value === nothing) {
        this.templateResult = undefined;
        return (this.value = value);
      }
      if (value === noChange) {
        return value;
      }
      if (isPrimitive(value) && value === this.value) {
        return this.templateResult;
      }
      this.value = value;
      const strings = ([String(value)] as unknown) as TemplateStringsArray;
      (strings as any).raw = strings;
      return (this.templateResult = {
        _$litType$: 1,
        strings,
        values: [],
      });
    }
  }
);

// https://tc39.github.io/ecma262/#sec-typeof-operator
type Primitive = null | undefined | boolean | number | string | symbol | bigint;
const isPrimitive = (value: unknown): value is Primitive =>
  value === null || (typeof value != 'object' && typeof value != 'function');
