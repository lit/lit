import {ReactiveElement} from 'lit';

import {createContext} from '@lit-labs/context';
import {consume, provide} from '@lit-labs/context/std-decorators.js';

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
      @provide({context: numberContext}) accessor simpleProvide = 0;
      @provide({context: numberOrUndefinedContext})
      accessor provideUndefinedWithDefined = 0;
      @provide({context: numberOrUndefinedContext})
      accessor provideUndefinedWithUndefined: number | undefined;
      @provide({context: numberContext})
      private accessor providePrivate = 0;
      @provide({context: numberContext})
      protected accessor provideProtected = 0;
      @provide({context: numberContext})
      accessor #provide = 0;

      constructor() {
        super();
        markAsUsed(this.providePrivate);
        markAsUsed(this.#provide);
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
      @consume({context: numberContext}) #consume = 0;
      @consume({context: numberContext})
      #consumeOptional?: number;

      @consume({context: numberContext}) accessor simpleConsumeAccessor = 0;
      @consume({context: numberOrUndefinedContext})
      accessor consumeUndefinedWithUndefinedAccessor: number | undefined;
      @consume({context: numberContext})
      private accessor consumePrivateAccessor = 0;
      @consume({context: numberContext})
      protected accessor consumeProtectedAccessor = 0;
      @consume({context: numberContext}) accessor #consumeAccessor = 0;

      constructor() {
        super();
        markAsUsed(this.consumePrivate);
        markAsUsed(this.consumePrivateOptional);
        markAsUsed(this.#consume);
        markAsUsed(this.#consumeOptional);
        markAsUsed(this.consumePrivateAccessor);
        markAsUsed(this.#consumeAccessor);
      }
    }
    markAsUsed(TestElement);
  });

  test('incorrect uses of @provide should produce type errors', () => {
    class TestElement extends ReactiveElement {
      // @ts-expect-error string providing number
      @provide({context: numberContext}) accessor provideStringWithNumber = '0';
      // @ts-expect-error number or undefined providing number
      @provide({context: numberContext}) accessor provideNumberWithUndefined:
        | number
        | undefined = 0;

      // @ts-expect-error string providing number
      @provide({context: numberContext})
      private accessor provideNumberWithPrivateString = '';
      // @ts-expect-error string providing number
      @provide({context: numberContext})
      protected accessor provideNumberWithProtectedString = '';
      // @ts-expect-error string providing number
      @provide({context: numberContext})
      #provideNumberWithString = '';

      constructor() {
        super();
        markAsUsed(this.provideNumberWithPrivateString);
        markAsUsed(this.provideNumberWithProtectedString);
        markAsUsed(this.#provideNumberWithString);
      }
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

      // @ts-expect-error private string consuming number
      @consume({context: numberContext})
      private consumeNumberWithPrivateString = '';
      // @ts-expect-error private optional string consuming number
      @consume({context: numberContext})
      private consumeNumberWithPrivateOptionalString?: string;
      // @ts-expect-error protected string consuming number
      @consume({context: numberContext})
      protected consumeNumberWithProtectedString = '';
      // @ts-expect-error protected optional string consuming number
      @consume({context: numberContext})
      protected consumeNumberWithProtectedOptionalString?: string;

      constructor() {
        super();
        markAsUsed(this.consumeNumberWithPrivateString);
        markAsUsed(this.consumeNumberWithPrivateOptionalString);
      }
    }
    markAsUsed(TestElement);
  });
});
