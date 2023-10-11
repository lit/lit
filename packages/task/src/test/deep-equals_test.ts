/**
 * @license
 * Portions Copyright 2023 Google LLC
 * Portions Copyright 2017 Evgeny Poberezkin
 * SPDX-License-Identifier: MIT
 */
import {assert} from '@esm-bundle/chai';
import {deepEquals} from '@lit/task/deep-equals.js';

// Test cases copied from fast-deep-equals
// https://github.com/epoberezkin/fast-deep-equal/blob/master/spec/tests.js
// https://github.com/epoberezkin/fast-deep-equal/blob/master/spec/es6tests.js

interface TestCase {
  description: string;
  value1: unknown;
  value2: unknown;
  equal: boolean;
  skip?: boolean;
}

interface TestCaseGroup {
  description: string;
  tests: Array<TestCase>;
}

function func1() {}
function func2() {}

class MyMap extends Map {}
class MySet extends Set {}
const emptyObj = {};

const skipBigInt = typeof BigInt == 'undefined';
const skipBigIntArray = typeof BigUint64Array == 'undefined';

function map(obj: object, Class: {new (): Map<unknown, unknown>} = Map) {
  const a = new Class();
  for (const [key, value] of Object.entries(obj)) {
    a.set(key, value);
  }
  return a;
}

function myMap(obj: object) {
  return map(obj, MyMap);
}

function set(arr: Array<unknown>, Class: {new (): Set<unknown>} = Set) {
  const a = new Class();
  for (const value of arr) {
    a.add(value);
  }
  return a;
}

function mySet(arr: Array<unknown>) {
  return set(arr, MySet);
}

const testCases: Array<TestCaseGroup> = [
  {
    description: 'scalars',
    tests: [
      {
        description: 'equal numbers',
        value1: 1,
        value2: 1,
        equal: true,
      },
      {
        description: 'not equal numbers',
        value1: 1,
        value2: 2,
        equal: false,
      },
      {
        description: 'number and array are not equal',
        value1: 1,
        value2: [],
        equal: false,
      },
      {
        description: '0 and null are not equal',
        value1: 0,
        value2: null,
        equal: false,
      },
      {
        description: 'equal strings',
        value1: 'a',
        value2: 'a',
        equal: true,
      },
      {
        description: 'not equal strings',
        value1: 'a',
        value2: 'b',
        equal: false,
      },
      {
        description: 'empty string and null are not equal',
        value1: '',
        value2: null,
        equal: false,
      },
      {
        description: 'null is equal to null',
        value1: null,
        value2: null,
        equal: true,
      },
      {
        description: 'equal booleans (true)',
        value1: true,
        value2: true,
        equal: true,
      },
      {
        description: 'equal booleans (false)',
        value1: false,
        value2: false,
        equal: true,
      },
      {
        description: 'not equal booleans',
        value1: true,
        value2: false,
        equal: false,
      },
      {
        description: '1 and true are not equal',
        value1: 1,
        value2: true,
        equal: false,
      },
      {
        description: '0 and false are not equal',
        value1: 0,
        value2: false,
        equal: false,
      },
      {
        description: 'NaN and NaN are equal',
        value1: NaN,
        value2: NaN,
        equal: true,
      },
      {
        // Opposite from fast-deep-equals because of Object.is()
        description: '0 and -0 are not equal',
        value1: 0,
        value2: -0,
        equal: false,
      },
      {
        description: 'Infinity and Infinity are equal',
        value1: Infinity,
        value2: Infinity,
        equal: true,
      },
      {
        description: 'Infinity and -Infinity are not equal',
        value1: Infinity,
        value2: -Infinity,
        equal: false,
      },
    ],
  },

  {
    description: 'objects',
    tests: [
      {
        description: 'empty objects are equal',
        value1: {},
        value2: {},
        equal: true,
      },
      {
        description: 'equal objects (same properties "order")',
        value1: {a: 1, b: '2'},
        value2: {a: 1, b: '2'},
        equal: true,
      },
      {
        description: 'equal objects (different properties "order")',
        value1: {a: 1, b: '2'},
        value2: {b: '2', a: 1},
        equal: true,
      },
      {
        description: 'not equal objects (extra property)',
        value1: {a: 1, b: '2'},
        value2: {a: 1, b: '2', c: []},
        equal: false,
      },
      {
        description: 'not equal objects (different property values)',
        value1: {a: 1, b: '2', c: 3},
        value2: {a: 1, b: '2', c: 4},
        equal: false,
      },
      {
        description: 'not equal objects (different properties)',
        value1: {a: 1, b: '2', c: 3},
        value2: {a: 1, b: '2', d: 3},
        equal: false,
      },
      {
        description: 'equal objects (same sub-properties)',
        value1: {a: [{b: 'c'}]},
        value2: {a: [{b: 'c'}]},
        equal: true,
      },
      {
        description: 'not equal objects (different sub-property value)',
        value1: {a: [{b: 'c'}]},
        value2: {a: [{b: 'd'}]},
        equal: false,
      },
      {
        description: 'not equal objects (different sub-property)',
        value1: {a: [{b: 'c'}]},
        value2: {a: [{c: 'c'}]},
        equal: false,
      },
      {
        description: 'empty array and empty object are not equal',
        value1: {},
        value2: [],
        equal: false,
      },
      {
        description: 'object with extra undefined properties are not equal #1',
        value1: {},
        value2: {foo: undefined},
        equal: false,
      },
      {
        description: 'object with extra undefined properties are not equal #2',
        value1: {foo: undefined},
        value2: {},
        equal: false,
      },
      {
        description: 'object with extra undefined properties are not equal #3',
        value1: {foo: undefined},
        value2: {bar: undefined},
        equal: false,
      },
      {
        description: 'nulls are equal',
        value1: null,
        value2: null,
        equal: true,
      },
      {
        description: 'null and undefined are not equal',
        value1: null,
        value2: undefined,
        equal: false,
      },
      {
        description: 'null and empty object are not equal',
        value1: null,
        value2: {},
        equal: false,
      },
      {
        description: 'undefined and empty object are not equal',
        value1: undefined,
        value2: {},
        equal: false,
      },
      {
        description:
          'objects with different `toString` functions returning same values are equal',
        value1: {toString: () => 'Hello world!'},
        value2: {toString: () => 'Hello world!'},
        equal: true,
      },
      {
        description:
          'objects with `toString` functions returning different values are not equal',
        value1: {toString: () => 'Hello world!'},
        value2: {toString: () => 'Hi!'},
        equal: false,
      },
    ],
  },

  {
    description: 'arrays',
    tests: [
      {
        description: 'two empty arrays are equal',
        value1: [],
        value2: [],
        equal: true,
      },
      {
        description: 'equal arrays',
        value1: [1, 2, 3],
        value2: [1, 2, 3],
        equal: true,
      },
      {
        description: 'not equal arrays (different item)',
        value1: [1, 2, 3],
        value2: [1, 2, 4],
        equal: false,
      },
      {
        description: 'not equal arrays (different length)',
        value1: [1, 2, 3],
        value2: [1, 2],
        equal: false,
      },
      {
        description: 'equal arrays of objects',
        value1: [{a: 'a'}, {b: 'b'}],
        value2: [{a: 'a'}, {b: 'b'}],
        equal: true,
      },
      {
        description: 'not equal arrays of objects',
        value1: [{a: 'a'}, {b: 'b'}],
        value2: [{a: 'a'}, {b: 'c'}],
        equal: false,
      },
      {
        description: 'pseudo array and equivalent array are not equal',
        value1: {'0': 0, '1': 1, length: 2},
        value2: [0, 1],
        equal: false,
      },
    ],
  },
  {
    description: 'Date objects',
    tests: [
      {
        description: 'equal date objects',
        value1: new Date('2017-06-16T21:36:48.362Z'),
        value2: new Date('2017-06-16T21:36:48.362Z'),
        equal: true,
      },
      {
        description: 'not equal date objects',
        value1: new Date('2017-06-16T21:36:48.362Z'),
        value2: new Date('2017-01-01T00:00:00.000Z'),
        equal: false,
      },
      {
        description: 'date and string are not equal',
        value1: new Date('2017-06-16T21:36:48.362Z'),
        value2: '2017-06-16T21:36:48.362Z',
        equal: false,
      },
      {
        description: 'date and object are not equal',
        value1: new Date('2017-06-16T21:36:48.362Z'),
        value2: {},
        equal: false,
      },
    ],
  },
  {
    description: 'RegExp objects',
    tests: [
      {
        description: 'equal RegExp objects',
        value1: /foo/,
        value2: /foo/,
        equal: true,
      },
      {
        description: 'not equal RegExp objects (different pattern)',
        value1: /foo/,
        value2: /bar/,
        equal: false,
      },
      {
        description: 'not equal RegExp objects (different flags)',
        value1: /foo/,
        value2: /foo/i,
        equal: false,
      },
      {
        description: 'RegExp and string are not equal',
        value1: /foo/,
        value2: 'foo',
        equal: false,
      },
      {
        description: 'RegExp and object are not equal',
        value1: /foo/,
        value2: {},
        equal: false,
      },
    ],
  },
  {
    description: 'functions',
    tests: [
      {
        description: 'same function is equal',
        value1: func1,
        value2: func1,
        equal: true,
      },
      {
        description: 'different functions are not equal',
        value1: func1,
        value2: func2,
        equal: false,
      },
    ],
  },
  {
    description: 'sample objects',
    tests: [
      {
        description: 'big object',
        value1: {
          prop1: 'value1',
          prop2: 'value2',
          prop3: 'value3',
          prop4: {
            subProp1: 'sub value1',
            subProp2: {
              subSubProp1: 'sub sub value1',
              subSubProp2: [1, 2, {prop2: 1, prop: 2}, 4, 5],
            },
          },
          prop5: 1000,
          prop6: new Date(2016, 2, 10),
        },
        value2: {
          prop5: 1000,
          prop3: 'value3',
          prop1: 'value1',
          prop2: 'value2',
          prop6: new Date('2016/03/10'),
          prop4: {
            subProp2: {
              subSubProp1: 'sub sub value1',
              subSubProp2: [1, 2, {prop2: 1, prop: 2}, 4, 5],
            },
            subProp1: 'sub value1',
          },
        },
        equal: true,
      },
    ],
  },
  {
    description: 'bigint',
    tests: [
      {
        description: 'equal bigints',
        value1: skipBigInt || BigInt(1),
        value2: skipBigInt || BigInt(1),
        equal: true,
        skip: skipBigInt,
      },
      {
        description: 'not equal bigints',
        value1: skipBigInt || BigInt(1),
        value2: skipBigInt || BigInt(2),
        equal: false,
        skip: skipBigInt,
      },
    ],
  },

  {
    description: 'Maps',
    tests: [
      {
        description: 'empty maps are equal',
        value1: new Map(),
        value2: new Map(),
        equal: true,
      },
      {
        description: 'empty maps of different class are not equal',
        value1: new Map(),
        value2: new MyMap(),
        equal: false,
      },
      {
        description: 'equal maps (same key "order")',
        value1: map({a: 1, b: '2'}),
        value2: map({a: 1, b: '2'}),
        equal: true,
      },
      {
        description:
          'not equal maps (same key "order" - instances of different classes)',
        value1: map({a: 1, b: '2'}),
        value2: myMap({a: 1, b: '2'}),
        equal: false,
      },
      {
        description: 'equal maps (different key "order")',
        value1: map({a: 1, b: '2'}),
        value2: map({b: '2', a: 1}),
        equal: true,
      },
      {
        description:
          'equal maps (different key "order" - instances of the same subclass)',
        value1: myMap({a: 1, b: '2'}),
        value2: myMap({b: '2', a: 1}),
        equal: true,
      },
      {
        description: 'not equal maps (extra key)',
        value1: map({a: 1, b: '2'}),
        value2: map({a: 1, b: '2', c: []}),
        equal: false,
      },
      {
        description: 'not equal maps (different key value)',
        value1: map({a: 1, b: '2', c: 3}),
        value2: map({a: 1, b: '2', c: 4}),
        equal: false,
      },
      {
        description: 'not equal maps (different keys)',
        value1: map({a: 1, b: '2', c: 3}),
        value2: map({a: 1, b: '2', d: 3}),
        equal: false,
      },
      {
        description: 'equal maps (same sub-keys)',
        value1: map({a: [map({b: 'c'})]}),
        value2: map({a: [map({b: 'c'})]}),
        equal: true,
      },
      {
        description: 'not equal maps (different sub-key value)',
        value1: map({a: [map({b: 'c'})]}),
        value2: map({a: [map({b: 'd'})]}),
        equal: false,
      },
      {
        description: 'not equal maps (different sub-key)',
        value1: map({a: [map({b: 'c'})]}),
        value2: map({a: [map({c: 'c'})]}),
        equal: false,
      },
      {
        description: 'empty map and empty object are not equal',
        value1: {},
        value2: new Map(),
        equal: false,
      },
      {
        description: 'map with extra undefined key is not equal #1',
        value1: map({}),
        value2: map({foo: undefined}),
        equal: false,
      },
      {
        description: 'map with extra undefined key is not equal #2',
        value1: map({foo: undefined}),
        value2: map({}),
        equal: false,
      },
      {
        description: 'maps with extra undefined keys are not equal #3',
        value1: map({foo: undefined}),
        value2: map({bar: undefined}),
        equal: false,
      },
      {
        description: 'null and empty map are not equal',
        value1: null,
        value2: new Map(),
        equal: false,
      },
      {
        description: 'undefined and empty map are not equal',
        value1: undefined,
        value2: new Map(),
        equal: false,
      },
      {
        description: 'map and a pseudo map are not equal',
        value1: map({}),
        value2: {
          constructor: Map,
          size: 0,
          has: () => true,
          get: () => 1,
        },
        equal: false,
      },
    ],
  },

  {
    description: 'Sets',
    tests: [
      {
        description: 'empty sets are equal',
        value1: new Set(),
        value2: new Set(),
        equal: true,
      },
      {
        description: 'empty sets of different class are not equal',
        value1: new Set(),
        value2: new MySet(),
        equal: false,
      },
      {
        description: 'equal sets (same value "order")',
        value1: set(['a', 'b']),
        value2: set(['a', 'b']),
        equal: true,
      },
      {
        description:
          'not equal sets (same value "order" - instances of different classes)',
        value1: set(['a', 'b']),
        value2: mySet(['a', 'b']),
        equal: false,
      },
      {
        description: 'equal sets (different value "order")',
        value1: set(['a', 'b']),
        value2: set(['b', 'a']),
        equal: true,
      },
      {
        description:
          'equal sets (different value "order" - instances of the same subclass)',
        value1: mySet(['a', 'b']),
        value2: mySet(['b', 'a']),
        equal: true,
      },
      {
        description: 'not equal sets (extra value)',
        value1: set(['a', 'b']),
        value2: set(['a', 'b', 'c']),
        equal: false,
      },
      {
        description: 'not equal sets (different values)',
        value1: set(['a', 'b', 'c']),
        value2: set(['a', 'b', 'd']),
        equal: false,
      },
      {
        description: 'not equal sets (different instances of objects)',
        value1: set(['a', {}]),
        value2: set(['a', {}]),
        equal: false,
      },
      {
        description: 'equal sets (same instances of objects)',
        value1: set(['a', emptyObj]),
        value2: set(['a', emptyObj]),
        equal: true,
      },
      {
        description: 'empty set and empty object are not equal',
        value1: {},
        value2: new Set(),
        equal: false,
      },
      {
        description: 'empty set and empty array are not equal',
        value1: [],
        value2: new Set(),
        equal: false,
      },
      {
        description: 'set with extra undefined value is not equal #1',
        value1: set([]),
        value2: set([undefined]),
        equal: false,
      },
      {
        description: 'set with extra undefined value is not equal #2',
        value1: set([undefined]),
        value2: set([]),
        equal: false,
      },
      {
        description: 'set and pseudo set are not equal',
        value1: new Set(),
        value2: {
          constructor: Set,
          size: 0,
          has: () => true,
        },
        equal: false,
      },
    ],
  },

  {
    description: 'Typed arrays',
    tests: [
      {
        description: 'two empty arrays of the same class are equal',
        value1: new Int32Array([]),
        value2: new Int32Array([]),
        equal: true,
      },
      {
        description: 'two empty arrays of the different class are not equal',
        value1: new Int32Array([]),
        value2: new Int16Array([]),
        equal: false,
      },
      {
        description: 'equal arrays',
        value1: new Int32Array([1, 2, 3]),
        value2: new Int32Array([1, 2, 3]),
        equal: true,
      },
      {
        description: 'equal BigUint64Array arrays',
        value1:
          skipBigIntArray || new BigUint64Array(['1', '2', '3'].map(BigInt)),
        value2:
          skipBigIntArray || new BigUint64Array(['1', '2', '3'].map(BigInt)),
        equal: true,
        skip: skipBigIntArray,
      },
      {
        description: 'not equal BigUint64Array arrays',
        value1:
          skipBigIntArray || new BigUint64Array(['1', '2', '3'].map(BigInt)),
        value2:
          skipBigIntArray || new BigUint64Array(['1', '2', '4'].map(BigInt)),
        equal: false,
        skip: skipBigIntArray,
      },
      {
        description: 'not equal arrays (same items, different class)',
        value1: new Int32Array([1, 2, 3]),
        value2: new Int16Array([1, 2, 3]),
        equal: false,
      },
      {
        description: 'not equal arrays (different item)',
        value1: new Int32Array([1, 2, 3]),
        value2: new Int32Array([1, 2, 4]),
        equal: false,
      },
      {
        description: 'not equal arrays (different length)',
        value1: new Int32Array([1, 2, 3]),
        value2: new Int32Array([1, 2]),
        equal: false,
      },
      {
        description: 'pseudo array and equivalent typed array are not equal',
        value1: {'0': 1, '1': 2, length: 2, constructor: Int32Array},
        value2: new Int32Array([1, 2]),
        equal: false,
      },
    ],
  },
];

suite('deepEquals', () => {
  for (const testGroup of testCases) {
    suite(testGroup.description, () => {
      for (const testCase of testGroup.tests) {
        if (testCase.skip) {
          test.skip(testCase.description);
        } else {
          test(testCase.description, () => {
            assert.strictEqual(
              deepEquals(testCase.value1, testCase.value2),
              testCase.equal
            );
          });
        }
      }
    });
  }
});
