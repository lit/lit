import {DirectiveClass, DirectiveResult} from '../../directive.js';
import {guard} from '../../directives/guard.js';
import {classMap} from '../../directives/class-map.js';
import {keyed} from '../../directives/keyed.js';
import {live} from '../../directives/live.js';
import {until} from '../../directives/until.js';

type GetRenderAs<D extends DirectiveResult> =
  D extends DirectiveResult<infer C>
    ? C extends DirectiveClass<infer RenderAs>
      ? RenderAs
      : unknown
    : unknown;

// This test is entirely in the type checkeer, it doesn't need to run,
// it passes if it compiles without error.
if (false as boolean) {
  // Test the guard directive's type inference
  () => {
    const v = guard([1, 2, 3], () => 'hi');

    type VRendersAs = GetRenderAs<typeof v>;

    const vRendersAs = null! as VRendersAs;

    vRendersAs satisfies string;
    // @ts-expect-error
    vRendersAs satisfies number;
  };

  // Test the classMap directive's type inference
  () => {
    const v = classMap({
      foo: true,
      bar: false,
      baz: 0,
    });

    type VRendersAs = GetRenderAs<typeof v>;

    const vRendersAs = null! as VRendersAs;

    vRendersAs satisfies string;
    // @ts-expect-error
    vRendersAs satisfies number;
  };

  // Test the keyed directive's type inference
  () => {
    const v = keyed('key', 'value');

    type VRendersAs = GetRenderAs<typeof v>;

    const vRendersAs = null! as VRendersAs;

    vRendersAs satisfies string;
    // @ts-expect-error
    vRendersAs satisfies number;
  };

  // Test the live directive's type inference
  () => {
    const v = live('value' as const);

    type VRendersAs = GetRenderAs<typeof v>;

    const vRendersAs = null! as VRendersAs;

    vRendersAs satisfies 'value';
    // @ts-expect-error
    vRendersAs satisfies number;

    const v2 = live(42 as const);
    type VRendersAs2 = GetRenderAs<typeof v2>;
    const vRendersAs2: VRendersAs2 = null!;
    vRendersAs2 satisfies 42;
    // @ts-expect-error
    vRendersAs2 satisfies string;
  };

  // Test the until directive's type inference
  () => {
    const v = until('value' as const, 'loading' as const);

    type VRendersAs = GetRenderAs<typeof v>;

    const vRendersAs = null! as VRendersAs;

    vRendersAs satisfies 'value' | 'loading';
    // @ts-expect-error
    vRendersAs satisfies number;

    const v2 = until(42 as const, 'loading' as const);
    type VRendersAs2 = GetRenderAs<typeof v2>;
    const vRendersAs2 = null! as VRendersAs2;
    vRendersAs2 satisfies 42 | 'loading';
    // @ts-expect-error
    vRendersAs2 satisfies string;

    const v3 = until(Promise.resolve('value' as const), 42 as const);
    type VRendersAs3 = GetRenderAs<typeof v3>;
    const vRendersAs3 = null! as VRendersAs3;
    vRendersAs3 satisfies 'value' | 42;
    // @ts-expect-error
    vRendersAs3 satisfies string;
    // @ts-expect-error
    vRendersAs3 satisfies Promise<any>;

    const v4 = until(
      Promise.resolve(42 as const),
      Promise.resolve('something' as const)
    );

    type VRendersAs4 = GetRenderAs<typeof v4>;
    const vRendersAs4 = null! as VRendersAs4;
    vRendersAs4 satisfies 42 | 'something';
    // @ts-expect-error
    vRendersAs4 satisfies string;
    // @ts-expect-error
    vRendersAs4 satisfies Promise<any>;
  };
}
