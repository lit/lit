import {test, describe as suite} from 'node:test';

suite('index', () => {
  test('should work', () => {
    const o = {
      foo() {
        return 42;
      },
    };

    type O = typeof o;

    // @ts-expect-error - This is a test
    class OBase implements O {
      constructor() {
        return o;
      }
    }

    class A extends OBase {
      constructor() {
        super();
      }
      foo() {
        // @ts-expect-error - This is a test
        return super.foo();
      }
    }

    const a = new A();
    console.log(a.foo());
  });
});
