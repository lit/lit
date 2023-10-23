/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {suite} from 'uvu';
// eslint-disable-next-line import/extensions
import * as assert from 'uvu/assert';
import {
  AnalyzerModuleTestContext,
  languages,
  setupAnalyzerForTestWithModule,
} from '../utils.js';

for (const lang of languages) {
  const test = suite<AnalyzerModuleTestContext>(`Function tests (${lang})`);

  test.before((ctx) => {
    setupAnalyzerForTestWithModule(ctx, lang, 'functions', 'functions');
  });

  test('Function 1', ({module}) => {
    const exportedFn = module.getResolvedExport('function1');
    const fn = module.getDeclaration('function1');
    assert.equal(fn, exportedFn);
    assert.ok(fn?.isFunctionDeclaration());
    assert.equal(fn.name, `function1`);
    assert.equal(fn.description, `Function 1 description`);
    assert.equal(fn.summary, undefined);
    assert.equal(fn.parameters?.length, 0);
    assert.equal(fn.deprecated, undefined);
  });

  test('Function 2', ({module}) => {
    const exportedFn = module.getResolvedExport('function2');
    const fn = module.getDeclaration('function2');
    assert.equal(fn, exportedFn);
    assert.ok(fn?.isFunctionDeclaration());
    assert.equal(fn.name, `function2`);
    assert.equal(fn.summary, `Function 2 summary\nwith wraparound`);
    assert.equal(fn.description, `Function 2 description\nwith wraparound`);
    assert.equal(fn.parameters?.length, 3);
    assert.equal(fn.parameters?.[0].name, 'a');
    assert.equal(fn.parameters?.[0].description, 'Param a description');
    assert.equal(fn.parameters?.[0].summary, undefined);
    assert.equal(fn.parameters?.[0].type?.text, 'string');
    assert.equal(fn.parameters?.[0].default, undefined);
    assert.equal(fn.parameters?.[0].rest, false);
    assert.equal(fn.parameters?.[1].name, 'b');
    assert.equal(
      fn.parameters?.[1].description,
      'Param b description\nwith wraparound'
    );
    assert.equal(fn.parameters?.[1].type?.text, 'boolean');
    assert.equal(fn.parameters?.[1].optional, true);
    assert.equal(fn.parameters?.[1].default, 'false');
    assert.equal(fn.parameters?.[1].rest, false);
    assert.equal(fn.parameters?.[2].name, 'c');
    assert.equal(fn.parameters?.[2].description, 'Param c description');
    assert.equal(fn.parameters?.[2].summary, undefined);
    assert.equal(fn.parameters?.[2].type?.text, 'number[]');
    assert.equal(fn.parameters?.[2].optional, false);
    assert.equal(fn.parameters?.[2].default, undefined);
    assert.equal(fn.parameters?.[2].rest, true);
    assert.equal(fn.return?.type?.text, 'string');
    assert.equal(fn.return?.description, 'Function 2 return description');
    assert.equal(fn.deprecated, 'Function 2 deprecated');
  });

  test('Default function', ({module}) => {
    const exportedFn = module.getResolvedExport('default');
    const fn = module.getDeclaration('default');
    assert.equal(fn, exportedFn);
    assert.ok(fn?.isFunctionDeclaration());
    assert.equal(fn.name, `default`);
    assert.equal(fn.description, `Default function description`);
    assert.equal(fn.summary, undefined);
    assert.equal(fn.parameters?.length, 0);
    assert.equal(fn.return?.type?.text, 'string');
    assert.equal(fn.return?.description, 'Default function return description');
    assert.equal(fn.deprecated, undefined);
  });

  test('Const function', ({module}) => {
    const exportedFn = module.getResolvedExport('constFunction');
    const fn = module.getDeclaration('constFunction');
    assert.equal(fn, exportedFn);
    assert.ok(fn?.isFunctionDeclaration());
    assert.equal(fn.name, `constFunction`);
    assert.equal(fn.summary, `Const function summary\nwith wraparound`);
    assert.equal(fn.description, `Const function description\nwith wraparound`);
    assert.equal(fn.parameters?.length, 3);
    assert.equal(fn.parameters?.[0].name, 'a');
    assert.equal(fn.parameters?.[0].description, 'Param a description');
    assert.equal(fn.parameters?.[0].summary, undefined);
    assert.equal(fn.parameters?.[0].type?.text, 'string');
    assert.equal(fn.parameters?.[0].default, undefined);
    assert.equal(fn.parameters?.[0].rest, false);
    assert.equal(fn.parameters?.[1].name, 'b');
    assert.equal(
      fn.parameters?.[1].description,
      'Param b description\nwith wraparound'
    );
    assert.equal(fn.parameters?.[1].type?.text, 'boolean');
    assert.equal(fn.parameters?.[1].optional, true);
    assert.equal(fn.parameters?.[1].default, 'false');
    assert.equal(fn.parameters?.[1].rest, false);
    assert.equal(fn.parameters?.[2].name, 'c');
    assert.equal(fn.parameters?.[2].description, 'Param c description');
    assert.equal(fn.parameters?.[2].summary, undefined);
    assert.equal(fn.parameters?.[2].type?.text, 'number[]');
    assert.equal(fn.parameters?.[2].optional, false);
    assert.equal(fn.parameters?.[2].default, undefined);
    assert.equal(fn.parameters?.[2].rest, true);
    assert.equal(fn.return?.type?.text, 'string');
    assert.equal(fn.return?.description, 'Const function return description');
    assert.equal(fn.deprecated, 'Const function deprecated');
  });

  test('Const arrow function', ({module}) => {
    const exportedFn = module.getResolvedExport('constArrowFunction');
    const fn = module.getDeclaration('constArrowFunction');
    assert.equal(fn, exportedFn);
    assert.ok(fn?.isFunctionDeclaration());
    assert.equal(fn.name, `constArrowFunction`);
    assert.equal(fn.summary, `Const arrow function summary\nwith wraparound`);
    assert.equal(
      fn.description,
      `Const arrow function description\nwith wraparound`
    );
    assert.equal(fn.parameters?.length, 3);
    assert.equal(fn.parameters?.[0].name, 'a');
    assert.equal(fn.parameters?.[0].description, 'Param a description');
    assert.equal(fn.parameters?.[0].summary, undefined);
    assert.equal(fn.parameters?.[0].type?.text, 'string');
    assert.equal(fn.parameters?.[0].default, undefined);
    assert.equal(fn.parameters?.[0].rest, false);
    assert.equal(fn.parameters?.[1].name, 'b');
    assert.equal(
      fn.parameters?.[1].description,
      'Param b description\nwith wraparound'
    );
    assert.equal(fn.parameters?.[1].type?.text, 'boolean');
    assert.equal(fn.parameters?.[1].optional, true);
    assert.equal(fn.parameters?.[1].default, 'false');
    assert.equal(fn.parameters?.[1].rest, false);
    assert.equal(fn.parameters?.[2].name, 'c');
    assert.equal(fn.parameters?.[2].description, 'Param c description');
    assert.equal(fn.parameters?.[2].summary, undefined);
    assert.equal(fn.parameters?.[2].type?.text, 'number[]');
    assert.equal(fn.parameters?.[2].optional, false);
    assert.equal(fn.parameters?.[2].default, undefined);
    assert.equal(fn.parameters?.[2].rest, true);
    assert.equal(fn.return?.type?.text, 'string');
    assert.equal(
      fn.return?.description,
      'Const arrow function return description'
    );
    assert.equal(fn.deprecated, 'Const arrow function deprecated');
  });

  test('Async function', ({module}) => {
    const exportedFn = module.getResolvedExport('asyncFunction');
    const fn = module.getDeclaration('asyncFunction');
    assert.equal(fn, exportedFn);
    assert.ok(fn?.isFunctionDeclaration());
    assert.equal(fn.name, `asyncFunction`);
    assert.equal(fn.description, `Async function description`);
    assert.equal(fn.summary, undefined);
    assert.equal(fn.parameters?.[0].name, 'a');
    assert.equal(fn.parameters?.[0].description, 'Param a description');
    assert.equal(fn.parameters?.[0].summary, undefined);
    assert.equal(fn.parameters?.[0].type?.text, 'string');
    assert.equal(fn.parameters?.[0].default, undefined);
    assert.equal(fn.parameters?.[0].rest, false);
    assert.equal(fn.return?.type?.text, 'Promise<string>');
    assert.equal(fn.return?.description, 'Async function return description');
    assert.equal(fn.deprecated, 'Async function deprecated');
  });

  test('Overloaded function', ({module}) => {
    const exportedFn = module.getResolvedExport('overloaded');
    const fn = module.getDeclaration('overloaded');
    assert.equal(fn, exportedFn);
    assert.ok(fn?.isFunctionDeclaration());
    assert.equal(fn.name, 'overloaded');
    assert.equal(
      fn.description,
      'This signature works with strings or numbers.'
    );
    assert.equal(fn.summary, undefined);
    assert.equal(fn.parameters?.length, 1);
    assert.equal(fn.parameters?.[0].name, 'x');
    assert.equal(
      fn.parameters?.[0].description,
      'Accepts either a string or a number.'
    );
    assert.equal(fn.parameters?.[0].summary, undefined);
    assert.equal(fn.parameters?.[0].type?.text, 'string | number');
    assert.equal(fn.parameters?.[0].default, undefined);
    assert.equal(fn.parameters?.[0].rest, false);
    assert.equal(fn.return?.type?.text, 'string | number');
    assert.equal(
      fn.return?.description,
      'Returns either a string or a number.'
    );
    assert.equal(fn.deprecated, undefined);

    // TODO: Run the same assertions in both languages once TS supports
    // `@overload` for JSDoc in JS.
    // <https://devblogs.microsoft.com/typescript/announcing-typescript-5-0-rc/#overload-support-in-jsdoc>
    if (lang === 'ts') {
      assert.ok(fn.overloads);
      assert.equal(fn.overloads.length, 2);

      assert.equal(fn.overloads[0].name, 'overloaded');
      assert.equal(
        fn.overloads[0].description,
        'This signature only works with strings.'
      );
      assert.equal(fn.overloads[0].summary, undefined);
      assert.equal(fn.overloads[0].parameters?.length, 1);
      assert.equal(fn.overloads[0].parameters?.[0].name, 'x');
      assert.equal(
        fn.overloads[0].parameters?.[0].description,
        'Accepts a string.'
      );
      assert.equal(fn.overloads[0].parameters?.[0].summary, undefined);
      assert.equal(fn.overloads[0].parameters?.[0].type?.text, 'string');
      assert.equal(fn.overloads[0].parameters?.[0].default, undefined);
      assert.equal(fn.overloads[0].parameters?.[0].rest, false);
      assert.equal(fn.overloads[0].return?.type?.text, 'string');
      assert.equal(fn.overloads[0].return?.description, 'Returns a string.');
      assert.equal(fn.overloads[0].deprecated, undefined);

      assert.equal(fn.overloads[1].name, 'overloaded');
      assert.equal(
        fn.overloads[1].description,
        'This signature only works with numbers.'
      );
      assert.equal(fn.overloads[1].summary, undefined);
      assert.equal(fn.overloads[1].parameters?.length, 1);
      assert.equal(fn.overloads[1].parameters?.[0].name, 'x');
      assert.equal(
        fn.overloads[1].parameters?.[0].description,
        'Accepts a number.'
      );
      assert.equal(fn.overloads[1].parameters?.[0].summary, undefined);
      assert.equal(fn.overloads[1].parameters?.[0].type?.text, 'number');
      assert.equal(fn.overloads[1].parameters?.[0].default, undefined);
      assert.equal(fn.overloads[1].parameters?.[0].rest, false);
      assert.equal(fn.overloads[1].return?.type?.text, 'number');
      assert.equal(fn.overloads[1].return?.description, 'Returns a number.');
      assert.equal(fn.overloads[1].deprecated, undefined);
    } else {
      assert.equal(fn.overloads?.length ?? 0, 0);
    }
  });

  test.run();
}
