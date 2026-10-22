import {ReactiveElement} from 'lit';

import {createContext, consume, provide} from '@lit/context';

const numberContext = createContext<number>('number');
const numberOrUndefinedContext = createContext<number | undefined>(
  'numberOrUndefined'
);

// to silence linters
function markAsUsed(val: unknown) {
  if (false as boolean) {
    console.log(val);
  }
}

suite('compilation tests', () => {
  // this code doesn't need to run, it's tested by tsc
  if (true as boolean) {
    return;
  }

  test('correct uses of @provide should type check', () => {
    class TestElement extends ReactiveElement {
      @provide({context: numberContext}) simpleProvide = 0;
      @provide({context: numberOrUndefinedContext})
      provideUndefinedWithDefined = 0;
      @provide({context: numberOrUndefinedContext})
      provideUndefinedWithUndefined: number | undefined;
      @provide({context: numberOrUndefinedContext})
      provideUndefinedWithOptional?: number;
      @provide({context: numberOrUndefinedContext})
      provideUndefinedWithOptionalUndefined?: number | undefined;
      @provide({context: numberContext})
      private providePrivate = 0;
      @provide({context: numberContext})
      private providePrivateOptional?: number;
      @provide({context: numberContext})
      protected provideProtected = 0;
      @provide({context: numberContext})
      protected provideProtectedOptional?: number;
      constructor() {
        super();
        markAsUsed(this.providePrivate);
        markAsUsed(this.providePrivateOptional);
      }
    }
    markAsUsed(TestElement);
  });

  test('correct uses of @consume should type check', () => {
    class TestElement extends ReactiveElement {
      @consume({context: numberContext}) simpleConsume = 0;
      @consume({context: numberOrUndefinedContext})
      consumeUndefinedWithUndefined: number | undefined;
      @consume({context: numberOrUndefinedContext})
      consumeUndefinedWithOptional?: number;
      @consume({context: numberOrUndefinedContext})
      consumeUndefinedWithOptionalUndefined?: number | undefined;
      @consume({context: numberContext}) private consumePrivate = 0;
      @consume({context: numberContext})
      private consumePrivateOptional?: number;
      @consume({context: numberContext})
      protected consumeProtected = 0;
      @consume({context: numberContext})
      protected consumeProtectedOptional?: number;
      constructor() {
        super();
        markAsUsed(this.consumePrivate);
        markAsUsed(this.consumePrivateOptional);
      }
    }
    markAsUsed(TestElement);
  });

  test('incorrect uses of @provide should produce type errors', () => {
    class TestElement extends ReactiveElement {
      // @ts-expect-error string providing number
      @provide({context: numberContext}) provideStringWithNumber = '0';
      // @ts-expect-error number or undefined providing number
      @provide({context: numberContext}) provideNumberWithUndefined:
        | number
        | undefined = 0;
      // @ts-expect-error optional number providing into number
      @provide({context: numberContext}) provideNumberWithOptional?: number;
      // @ts-expect-error optional number providing into number
      @provide({context: numberContext}) provideNumberWithOptionalUndefined?:
        | number
        | undefined;

      // We'd like this to work. See https://github.com/lit/lit/issues/3926
      // @ts-expect-error experimental decorators unsupported on #private fields
      @provide({context: numberContext}) #provideToPrivate = 0;
    }
    markAsUsed(TestElement);
  });

  test('incorrect uses of @consume should produce type errors', () => {
    class TestElement extends ReactiveElement {
      // @ts-expect-error string consuming number
      @consume({context: numberContext}) consumeNumberWithString = '0';
      // @ts-expect-error string consuming number
      @consume({context: numberContext})
      consumeNumberWithOptionalString?: string;
      // @ts-expect-error number consuming number or undefined
      @consume({context: numberOrUndefinedContext})
      consumeUndefinedWithDefined = 0;
      // We'd like this to work. See https://github.com/lit/lit/issues/3926
      // @ts-expect-error experimental decorators unsupported on #private fields
      @consume({context: numberContext}) #consumeWithPrivate = 0;
    }
    markAsUsed(TestElement);
  });

  test(`things we wish wouldn't type check, but do currently`, () => {
    class TestElement extends ReactiveElement {
      @provide({context: numberContext})
      private provideNumberWithPrivateString = '';
      @provide({context: numberContext})
      private provideNumberWithPrivateOptionalString?: string;
      @provide({context: numberContext})
      protected provideNumberWithProtectedString = '';
      @provide({context: numberContext})
      protected provideNumberWithProtectedOptionalString?: string;

      @consume({context: numberContext})
      private consumeNumberWithPrivateString = '';
      @consume({context: numberContext})
      private consumeNumberWithPrivateOptionalString?: string;
      @consume({context: numberContext})
      protected consumeNumberWithProtectedString = '';
      @consume({context: numberContext})
      protected consumeNumberWithProtectedOptionalString?: string;

      constructor() {
        super();
        markAsUsed(this.provideNumberWithPrivateString);
        markAsUsed(this.provideNumberWithPrivateOptionalString);
        markAsUsed(this.consumeNumberWithPrivateString);
        markAsUsed(this.consumeNumberWithPrivateOptionalString);
      }
    }
    markAsUsed(TestElement);
  });
});
