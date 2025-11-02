/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {nothing} from 'lit';
import {directive, Directive, DirectiveResult} from 'lit/directive.js';

class SimpleDirective extends Directive {
  render(value: string) {
    return `Rendered value: ${value}`;
  }
}

export const simpleDirective = directive(SimpleDirective);

class GenericDirective<T> extends Directive {
  render(value: T): Exclude<T, undefined> | typeof nothing {
    if (value === undefined) {
      return nothing;
    }
    return value as Exclude<T, undefined>;
  }
}

type Generic = {<T>(value: T): DirectiveResult<typeof GenericDirective<T>>};

export const genericDirective: Generic = directive(GenericDirective);
