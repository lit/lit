/**
 * Test-only fake lit-html type declarations used to exercise
 * `getLitExpressionType` logic without depending on the real lit-html.
 *
 * The filename intentionally contains `lit-html` so that the helper's
 * `isSpecialValue` logic (which checks the source file path) treats these
 * exports as coming from lit-html.
 */

// Sentinel unique symbols (mimic lit-html exports). Using simple Symbol() so
// the declared type is a distinct unique symbol.
export const noChange = Symbol('noChange');
export const nothing = Symbol('nothing');

// Minimal DirectiveResult generic. Only the generic parameter (a constructor)
// is used by the code under test; the shape is irrelevant.
export interface DirectiveResult<
  C extends abstract new (...args: unknown[]) => unknown,
> {
  /** brand */ readonly __brand?: 'DirectiveResult';
  // Reference the generic so it is not flagged as unused.
  readonly __c?: C;
}

// Two fake directive classes with different render return types so we can
// verify unwrapping (including union return types).
export class MyDirective {
  render(): number {
    return 42;
  }
}

export class OtherDirective {
  render(): string | boolean {
    return '';
  }
}

// Export some typed values (the actual runtime values are not important;
// we just need the static types for the TypeScript type checker).
export const directiveResultNumber = {} as unknown as DirectiveResult<
  typeof MyDirective
>;
export const directiveResultUnion = {} as unknown as DirectiveResult<
  typeof OtherDirective
>;
export const directiveResultOrString = {} as unknown as
  | DirectiveResult<typeof MyDirective>
  | string;
export const sentinelOnly = noChange;
export const sentinelUnion: typeof noChange | number = noChange;
export const nothingValue = nothing;
export const nothingUnion: typeof nothing | string = nothing;

// Plain non-special exports for negative test cases.
export const plainNumber = 123;
export const plainUnion: number | string = 0 as unknown as number | string;
