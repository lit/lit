/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {noChange, nothing} from 'lit';
// Re-export the real sentinel values so tests can access their original symbol names.
export {noChange, nothing};
import {Directive, DirectiveResult} from 'lit/directive.js';

// Two directive classes with different render signatures so we can verify
// unwrapping (including union return types) of DirectiveResult.
export class MyDirective extends Directive {
  render(): number {
    return 42;
  }
}

export class OtherDirective extends Directive {
  render(): string | boolean {
    return '';
  }
}

// Export some typed values (the actual runtime values are not important; we
// just need the static types for the TypeScript type checker). Use a simple
// cast to avoid needing to construct real DirectiveResult values.
export const directiveResultNumber = {} as unknown as DirectiveResult<
  typeof MyDirective
>;
export const directiveResultUnion = {} as unknown as DirectiveResult<
  typeof OtherDirective
>;
export const directiveResultOrString = {} as unknown as
  | DirectiveResult<typeof MyDirective>
  | string;

// Sentinel only / sentinel containing unions.
export const sentinelOnly: typeof noChange = noChange;
export const sentinelUnion: typeof noChange | number = noChange;
export const nothingValue: typeof nothing = nothing;
export const nothingUnion: typeof nothing | string = nothing;

// Plain non-special exports for negative test cases.
export const plainNumber = 123;
export const plainUnion: number | string = 0;
